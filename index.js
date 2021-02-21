const firebaseConfig = {
	apiKey: "AIzaSyBmOwq1Yta1Ycz-aQ8sEimYML7TUVM0VjU",
    authDomain: "fujitsu-hackathon-304810.firebaseapp.com",
    projectId: "fujitsu-hackathon-304810",
    storageBucket: "fujitsu-hackathon-304810.appspot.com",
    messagingSenderId: "260793951528",
    appId: "1:260793951528:web:bdeaa52ae55ded36559c1d",
    measurementId: "G-MG95EFLJKK"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth()


$("#getApiFromDb").submit((e) => {
	e.preventDefault();
	if (document.getElementById('address').value) {
	  getLatLng(document.getElementById('address').value, (latlng) => getApiFromDb(latlng));
	}
})

const getDb = () => {
	let positionOut = `
		<hr>
		<h2 class="mb-4">＜位置情報＞</h2>
		<hr>
		`;
	db.collection("position")
			.get()
			.then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					const data = doc.data();
					positionOut += `
						<ul class="mb-8">
							<li>緯度: ${data.lat}, 経度: ${data.lng}</li>
						</ul>
					`;
				});
				document.getElementById('position').innerHTML = positionOut;
			});

		let output = `
			<hr>
			<h2 class="mb-4 mt-4">＜近辺店舗情報＞</h2>
			<table class="table">
				<thread>
					<tr>
						<th style="width:200px;">店舗名称</th>
						<th style="width:200px;">緯度</th>
						<th style="width:200px;">経度</th>
						<th style="width:200px;">店舗URL</th>
						<th style="width:200px;">混雑状況</th>
					</tr>
				</thread>
			</table>
		`;

	db.collection("stores")
			.get()
			.then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					const data = doc.data();
					output += `
					<table class="table">
						<tbody>
							<tr id="store-table-td">
								<td style="width: 20%;">${data.name}</td>
								<td style="width: 20%;">${data.lat}</td>
								<td style="width: 20%;">${data.lng}</td>
								<td style="width: 20%;">${data.storeUrl}</td>
								<td style="width: 20%;">${data.congestion}</td>
							</tr>
						</tbody>
					</table>
					`;
				});
				document.getElementById('output').innerHTML = output;
			});
}


const deleteData = async () => {
	await db.collection("stores").get().then(function(querySnapshot) {
		querySnapshot.forEach(function(doc) {
			console.log(doc.id, " => ", doc.data());
			db.collection("stores").doc(doc.id).delete().then(function() {
				console.log("stores: Document successfully deleted!");
				}).catch(function(error) {
						console.error("stores: Error removing document: ", error);
				});
		});
	});

	await db.collection("position").get().then(function(querySnapshot) {
		querySnapshot.forEach(function(doc) {
			console.log(doc.id, " => ", doc.data());
			db.collection("position").doc(doc.id).delete().then(function() {
				console.log("position: Document successfully deleted!");
				}).catch(function(error) {
						console.error("position: Error removing document: ", error);
				});
		});
	});
}

// delete -> post -> get
const getApiFromDb = async (latLng) => {
	// 初期化
	await deleteData()

	// post
	let latitude = latLng["lat"];
	let longitude = latLng["lng"];

	db.collection("position")
		.add({
			lat: latitude,
			lng: longitude
		})
		.then(function (docRef) {
			console.log("position: Document written with ID: ", docRef.id);
		})
		.catch(function (error) {
			console.error("position: Error adding document: ", error);
		});

	const range = 3;
	const count = 50;
	const apiUrl = `http://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=fa9d37307b2c626a&lat=${latitude}&lng=${longitude}&range=${range}&type=lite&count=${count}&format=jsonp`;
	await $.ajax({
		url: apiUrl,
		type: 'GET',
		dataType: 'jsonp',
		jsonpCallback: 'callback'
	}).done(function(data) {
		shopData = data.results.shop
		$.each(shopData, function(index, value){
			db.collection("stores")
				.add({
					name: value.name,
					lat: value.lat,
					lng: value.lng,
					storeUrl: value.urls.pc,
					photoUrl: value.photo.pc.l,
					congestion: Math.random()
				})
				.catch(function (error) {
					console.error("Error adding document: ", error);
				});
			})
	}).fail((err) => console.log(err));
	console.log("POST COMPLETE")

	// get
	getDb();
	console.log("GET COMPLETE")
}