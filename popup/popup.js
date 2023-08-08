import { getActiveTab } from './utils.js';

// TODO quitar este mockMessage porque va a venir del backend
const mockMessage = 'Hola X! Tu background me pareció muy interesante para un rol de UI Developer que estoy buscando. Requiere de buen inglés y experiencia en Json / HTML / CSS y Javascript (entre otros); Tenemos 27 días libres al año y pago en USD. Me encantaría charlar sin compromiso, desde ya gracias!';
let timeoutSendMsg, timeoutGetMsg, timeoutClearElems;

const container = document.getElementById('container-main');
const selectPosition = document.getElementById('position');
const recruiterName = document.getElementById('recruiterName');
const recruiterEmail = document.getElementById('recruiterEmail');
const btnGetMessage = document.getElementById('get-message');
const btnUpdateStatus = document.getElementById('update-status');
const divProfileText = document.getElementById('profile-text');
const divNotLinkedinPage = document.getElementById('not-linkedin-page');
const divCandidateExists = document.getElementById('candidate-exists');
const positionSection = document.getElementById('positionSection');
const messageSection = document.getElementById('messageSection');
const containerMain = document.getElementById('container-main');
const containerContacted = document.getElementById('container-contacted');
const contactedSection = document.getElementById('contactedSection');
const getStatus = document.getElementById('get-status');
const alertMessages = document.getElementById('mesagges');

const getProfileDataFromStorage = () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['currentProfile'], (obj) => {
            resolve(obj['currentProfile'] ? JSON.parse(obj['currentProfile']) : {});
        });
    });
};

const getProfileFromLinkedin = async () => {
    const { id: tabId, url } = await getActiveTab();
    const linkedInProfileId = url.split('in/')[1];

    await chrome.tabs.sendMessage(tabId, { type: "GET_PROFILE", linkedInProfileId });

    const profileData = await getProfileDataFromStorage();
    divProfileText.innerText = 'Loading...';//JSON.stringify(profileData, undefined, 2);

    return profileData;
};

const sendPost = async (data) => {
    const response = await fetch("https://sw7blq3c19.execute-api.us-east-1.amazonaws.com/production/get-candidate-template", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const { id: tabId, url } = await getActiveTab();
    const result = await response.json();
    const resultJson = JSON.stringify(result);
    const resultParsed = JSON.parse(resultJson);
    const contentParsed = JSON.parse(resultParsed.content)
    divProfileText.innerText = contentParsed.message;
    await chrome.tabs.sendMessage(tabId, { type: "CREATE_MESSAGE", message: contentParsed.message });
}

const getPositions = async () => {
    const response = await fetch("https://sw7blq3c19.execute-api.us-east-1.amazonaws.com/production/get-positions", {
      method: "GET", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      }
    });

    const result = await response.json();
    const jsonResult = JSON.stringify(result);
    const jsonArray = JSON.parse(jsonResult);
    var positionSelect = document.getElementById("position");
    for (let i = 0; i < jsonArray.length; i++) {
        var option = document.createElement("option");
        option.text = jsonArray[i].name;
        option.value = jsonArray[i].name;
        positionSelect.add(option);
    }
}

const createId = async (name) => {
    const lowerCaseStr = name.toLowerCase();
  
    const formattedStr = lowerCaseStr.replace(/\s+/g, '-');
  
    return formattedStr;

}

const getCandidate = async(data) => {

    const unique_id = await createId(data.name);
    const response = await fetch("https://sw7blq3c19.execute-api.us-east-1.amazonaws.com/production/get-candidate?id="+unique_id, {
        method: "GET", // or 'PUT'
        headers: {
          "Content-Type": "application/json",
        }
      });
  
      const result = await response.json();
      const jsonResult = JSON.stringify(result);
      const parsedResult = JSON.parse(jsonResult);
      if (jsonResult != 'null'){
        positionSection.remove();
        messageSection.remove();
        containerMain.remove();
        getStatus.innerHTML += await convertStatus(parsedResult.status);
      }
      else{
        containerContacted.remove();
        contactedSection.remove();
      }
      
}

const convertStatus = async (status) => {
    return status
    .split('_')
    .map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');  
}

const onUpdateStatus = async () => {
    const selectStatus = document.getElementById('status');
    const statusSelected = selectStatus.value;
    const profileData = await getProfileDataFromStorage();
    const parsedData = JSON.parse(JSON.stringify(profileData));
    const data = {
        "status": statusSelected,
        "name": parsedData.name
    };
    const response = await fetch("https://sw7blq3c19.execute-api.us-east-1.amazonaws.com/production/update-status", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    chrome.runtime.reload();
}

const onGetMessageFromBackend = async () => {
    const selectedPosition = selectPosition.value;
    const recruiterNameValue = recruiterName.value;
    const recruiterEmailValue = recruiterEmail.value;

    if (selectedPosition) {
        const profile = await getProfileFromLinkedin();
        const { id: tabId } = await getActiveTab();

        const data = {
            recruiterName : recruiterNameValue,
            recruiterEmail: recruiterEmailValue,
            json: profile,
            position: selectedPosition
        }

        await sendPost(data);
        await chrome.tabs.sendMessage(tabId, { type: "SAVE_POSITION", message: selectedPosition });
    }
};

const clearElements = () => {
    selectPosition.selectedIndex = 0;
    divProfileText.innerText = '';

    timeoutClearElems = setTimeout(() => {
        clearTimeout(timeoutSendMsg);
        clearTimeout(timeoutGetMsg);
        clearTimeout(timeoutClearElems);
    }, 4000)
};

const contentLoadedHandler = async () => {
    // TODO: la idea es que "el onInit" de la extensión se fije si el candidato está en la DB -> si no está es lo que ya tenemos,
    //  si está, entonces debería aparecer un mensaje como que ese candidato ya fue contactado y la posibilidad de ser taggeado como
    // listo para agendar
    // descartado
    // futuro contacto

    const activeTab = await getActiveTab();
    const linkedInProfileId = activeTab.url.split('in/')[1];

    if (activeTab.url.includes("linkedin.com/in") && linkedInProfileId) {
        container.setAttribute('style', 'display:block');
        divNotLinkedinPage.setAttribute('style', 'display:none');
    } else {
        container.setAttribute('style', 'display:none');
        divNotLinkedinPage.setAttribute('style', 'display:block');
    }
    const profileData = await getProfileDataFromStorage();
    getPositions();
    getCandidate(JSON.parse(JSON.stringify(profileData)));
}

document.addEventListener("DOMContentLoaded", contentLoadedHandler);
btnGetMessage.addEventListener('click', onGetMessageFromBackend);
btnUpdateStatus.addEventListener('click', onUpdateStatus);