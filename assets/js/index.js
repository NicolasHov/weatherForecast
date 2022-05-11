// not secure, nut no other real options right now ;)
const OCD_API_KEY= "1a91235147f74f4fb13e628ac092a08f"
const OWM_API_KEY= "d0fcc00c02efe5b8355fa57156f79f2b"

// fonction qui interroge l'API et renvoie les data en JSON 
function getDataFromAPIs(args) {
    let URL = ""
    if (typeof args === "string") URL = `https://api.opencagedata.com/geocode/v1/json?q=${args}&key=${OCD_API_KEY}&pretty=1&no_annotations=1&limit=1`
    else URL = `https://api.openweathermap.org/data/2.5/onecall?lat=${args.lat}&lon=${args.long}&cnt=7&exclude=minutely,hourly&units=metric&appid=${OWM_API_KEY}` // doc : https://openweathermap.org/api/one-call-api

    return fetch(URL)
        .then(response => {
            if (response.ok) {
                return response.json() //attention à return pour pouvoir récupèrer les infos dans le 'then' suivant
                // le .json() permet d'extraire le json de la response récupèré 
            }
            else console.log("Error while fetching data");
        })
        .then(data => {
            return data
        })
        .catch(error => console.log(error))
}

// fonction qui prend en arguments une id, un text, une icone et retourne un composant (un bout de html) 
function componentCardDay(id_meteo) {
    return `
        <div class="card-day" data-id=${id_meteo}>
            <img id="imageURL" class="card-icon" src="${getWeatherCategory(id_meteo)}" alt="weather image">
        </div>`
}

// fonction qui renvoie le nom du jour de la semaine correspondant à l'index
function getNameOfDay(index) {
    const week = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
    return week[index % 7]
}

// display local time
function getHour(timestamp, timezone) {
    let date = new Date(timestamp * 1000); // we convert 'epoch' timestamp to 'javascript' timestamp by multiplying by 1000
    // see  https://timestamp-tool.fr/ to learn about 'dt' ('epoch')
    // Json response time format is "epoch" here we convert it to "UTC format"
    return date.toLocaleString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }) // Converts a date and time to a string, using a locale and a time zone.
    // to get the day ->  date.toLocaleString('en-GB', { timeZone: timezone, weekday: 'long' })
}
    

// fonction qui prend en argument une #id, un composant et des données et ajoute le composant dans le DOM 
function render(id, data, component) {
    const container = document.getElementById(id)
    
    if (container.childNodes) { removeAllChildNodes(container) } // on 'nettoie' le container
    
    // si le container existe, on créé un element pour chaque valeur du tableau 'data'
    if (container) {
        data.forEach((card, index) => {

            // on créé les éléments
            const dayCard = document.createElement("div")
            const dayOfTheWeekTitle = document.createElement("h5")
            
            // on met les données dans les éléments
            dayCard.innerHTML = component(card) // NB: innerHTML is not secure, especially with '+=' 
            let todayNumber = new Date().getDay()
            dayOfTheWeekTitle.innerHTML = getNameOfDay((todayNumber - 1) + index) // NB: innerHTML is not secure, especially with '+=' 

            // on ajoute les éléments à leur parent
            container.appendChild(dayCard);
            dayCard.appendChild(dayOfTheWeekTitle);
        })
    }
}


// fonction qui renvoie le 'path' de l'icône correspondant à l'id de la météo
function getWeatherCategory(id) { // Code Météo : https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
    let path = ""
    if (id === 800) {
        path = './assets/images/sun.svg'
    } else if (id >= 600 && 622 >= id) {
        path = './assets/images/snow.svg'
    } else if (id >= 801 && 804 >= id) {
        if (id === 801 || id === 802) {
            path = './assets/images/cloudy.svg'
        }
        if (id === 803 || id === 804) {
            path = './assets/images/clouds.svg'
        }
    } else {
        path = './assets/images/rain.svg'
    }
    return path
}

// fonction qui nettoie les div existantes (avant de ré-afficher qqchose)
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function getLightMode(timestamp, sunrise, sunset) {
    // console.log('time:', timestamp, sunrise, sunset) // debug);
    if (timestamp >= sunrise && timestamp <= sunset) {
        console.log("light mode");
        return true
    } else {  
        console.log("dark mode");
        return false 
    }
}

// ########### Gestion du cache du navigateur (localStorage) - (Bonus) ########## 

//fonctions qui récupère/crée/update un objet dans le localStorage 
const getCityLoaded = (cityName) => localStorage.getItem(cityName) ? JSON.parse(localStorage.getItem(cityName)) : []

const setCityLoaded = (cityName, dataCity) => localStorage.setItem(cityName, JSON.stringify(dataCity))

const addToCityLoaded = (cityName, newData) => {
    let dataCity = getCityLoaded(cityName);
    dataCity.push(...newData);
    setCityLoaded(cityName, dataCity)
}

// fonction qui vide le cache du navigateur (localStorage) toutes les 60 minutes
let myinterval = 60*60*1000; // 60 min interval
setInterval(() => { localStorage.clear() }, myinterval );




// ########### LOGIQUE DU PROGRAMME : ########## 

// let lightMode = false

// se déclenche au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
// ce code se déclenchera lorsque le user aura soumis le formulaire

    document.getElementById("form-meteo").addEventListener("submit", (event) => { // se déclenche 
        event.preventDefault() // important pour éviter les comportements par défaut, notammment le déclenchement du submit dès le chargement de la page 

        // 1. on récupère le nom de la ville rentrée par le user et le nombre de jours demandés
        let inputCityName = document.getElementById('city').value.trim().toLowerCase()
        let eltSelect = document.querySelector('select');

        // ### BONUS-'CACHE' : on vérifie si les data sont déjà enregistré dans le cache (LOCAL STORAGE)

        // on récupère toutes les 'key' dispo dans le localstorage
        if (Object.keys(localStorage).includes(inputCityName)) { 
            // console.log(getCityLoaded(inputCityName));
            // si la ville est déjà enregistrée (dans les key) dans le cache, on affiche le résultat :
            render("container", getCityLoaded(inputCityName).slice(0, eltSelect.selectedIndex), componentCardDay)
        } else {// sinon on continue :

         // ### 

            // 2. on récupère les données à l'aide de la fonction getDataFromAPIs qui est générique et change selon l'argument fourni
            getDataFromAPIs(inputCityName)
            .then(rawData => {
                
                // on formate les data récupérées pour avoir un objet 'coordsData' qui contient latitude et longitude
                let coordsData = { 
                    lat: rawData.results[0].geometry.lat, 
                    long: rawData.results[0].geometry.lng
                }
                console.log("coords:",coordsData);
                
                // 2-bis. on récupère les autres données, toujours à l'aide de la fonction getDataFromAPIs, les arguments ont changé
                getDataFromAPIs(coordsData)
                .then(rawData => {
                    let meteoDays = []
                    // let timeDays = []
                    
                    for(let i = 0; i < rawData.daily.length; i++) {
                        meteoDays.push(rawData.daily[i].weather[0].id)
                    }

                    addToCityLoaded(inputCityName, meteoDays) // (Bonus) localstorage

                    // 3. on affiche les infos dans un composant
                    render("container", meteoDays.slice(0, eltSelect.selectedIndex), componentCardDay)
                    
                    // Show UTC Hour of location
                    document.getElementById("locationHour").innerText = getHour(rawData.current.dt, rawData.timezone) + ' UTC Time';

                    // Change background color depending on the time of the day
                    if (getLightMode(rawData.current.dt, rawData.current.sunrise, rawData.current.sunset)) {
                        document.body.style.backgroundColor = '#e2dede';
                        // lightMode = true
                    } else {
                        document.body.style.backgroundColor = '#4e38b1';
                        // lightMode = false
                    }

                })
            })
        }
    });
});

