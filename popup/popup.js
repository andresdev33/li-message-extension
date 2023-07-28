import { getActiveTab } from './utils.js';

// TODO quitar este mockMessage porque va a venir del backend
const mockMessage = 'Hola X! Tu background me pareció muy interesante para un rol de UI Developer que estoy buscando. Requiere de buen inglés y experiencia en Json / HTML / CSS y Javascript (entre otros); Tenemos 27 días libres al año y pago en USD. Me encantaría charlar sin compromiso, desde ya gracias!';
let timeoutSendMsg, timeoutGetMsg, timeoutClearElems;

const container = document.getElementById('container');
const selectPosition = document.getElementById('position');
const btnGetMessage = document.getElementById('get-message');
const divProfileText = document.getElementById('profile-text');
const divNotLinkedinPage = document.getElementById('not-linkedin-page');

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
    divProfileText.innerText = JSON.stringify(profileData, undefined, 2);

    return profileData;
};

const onGetMessageFromBackend = async () => {
    const selectedPosition = selectPosition.value;

    if (selectedPosition) {
        const profile = await getProfileFromLinkedin();
        const { id: tabId } = await getActiveTab();

        // TODO: se envía al backend POST { jobPosition, profileData } => se obtiene { message, alertAlreadyContacted: boolean }
        console.log(`Sending request to backend with
                     position: ${selectedPosition}
                     and profile: ${JSON.stringify(profile)}`
        );

        // Simulación de espera de respuesta del backend, luego se envía el mensage obtenido de vuelta al contentScript
        timeoutGetMsg = setTimeout(async () => {
            await chrome.tabs.sendMessage(tabId, { type: "CREATE_MESSAGE", message: mockMessage });
            clearElements();
        }, 1000)
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
}

document.addEventListener("DOMContentLoaded", contentLoadedHandler);
btnGetMessage.addEventListener('click', onGetMessageFromBackend);
