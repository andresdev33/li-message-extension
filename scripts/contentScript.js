(() => {
    const currentProfile = {};

    const onMessageHandler = (obj, sender, response) => {
        const { type, value, linkedInProfileId } = obj;

        if (type === 'NEW') {
            newProfileLoaded(linkedInProfileId);
        }

        if (type === 'GET_PROFILE') {
            getProfile(linkedInProfileId);
        }

        if (type === 'CREATE_MESSAGE') {
            createLinkedInMessage(obj);
        }
    }

    chrome.runtime.onMessage.addListener(onMessageHandler);

    const newProfileLoaded = (linkedInProfileId) => {
        const [userName] = document.getElementsByTagName('h1');
        currentProfile.profileId = linkedInProfileId;
        currentProfile.name = userName.innerText;

        chrome.storage.sync.set({['currentProfile']: JSON.stringify(currentProfile)});
    };

    const getProfile = (linkedInProfileId) => {
        const [userName] = document.getElementsByTagName('h1');
        currentProfile.profileId = decodeURIComponent(linkedInProfileId.replace('/', ''));
        currentProfile.name = userName.innerText;
        currentProfile.about = getAbout();
        currentProfile.experience = getExperience();
        currentProfile.education = getEducation();

        chrome.storage.sync.set({['currentProfile']: JSON.stringify(currentProfile)});
    };

    const createLinkedInMessage = ({ message }) => {
        const messageBox = document.querySelector('div.msg-form__contenteditable.t-14.t-black--light.t-normal.flex-grow-1.full-height.notranslate');
        const placeholderDiv = document.querySelector('div.msg-form__placeholder.t-14.t-black--light.t-normal');

        if (!messageBox) {
            openMessagePopup(message);
        } else {
            messageBox.setAttribute('data-artdeco-is-focused', 'true');
            placeholderDiv.classList.remove('msg-form__placeholder');
            messageBox.click();
            messageBox.innerHTML = `<p>${message}</p>`
        }
    }

    const getAbout = () => {
        const siblings = getSiblingsById('about');
        return getDeepestSpanInnerText(siblings[1]);
    };

    const getSiblingsById = (elementId) => {
        const targetElement = document.getElementById(elementId);
        if (!targetElement) {
            console.error(`Element with ID '${elementId}' not found.`);
            return [];
        }

        const parentElement = targetElement.parentNode;
        return Array.from(parentElement.children).filter(child => child !== targetElement);
    };

    const getDeepestSpanInnerText = (element) => {
        let deepestSpan = null;
        let maxDepth = -1;

        function traverse(element, depth) {
            if (element.tagName === 'SPAN' && depth > maxDepth) {
                deepestSpan = element;
                maxDepth = depth;
            }

            const children = element.children;
            for (let i = 0; i < children.length; i++) {
                traverse(children[i], depth + 1);
            }
        }

        traverse(element, 0);

        return deepestSpan ? deepestSpan.innerText : '';
    };

    const getExperience = () => {
        const expContainer = getSiblingsById('experience')[1];
        return getSpansTexts(expContainer);
    };

    const getEducation = () => {
        const eduContainer = getSiblingsById('education')[1];
        return getSpansTexts(eduContainer);
    };

    const getSpansTexts = (parentElement) => {
        const allSpans = parentElement.querySelectorAll('span');
        const spanTexts = [];

        allSpans.forEach((span) => {
            const text = span.innerText.trim();
            if (text.length > 0) {
                spanTexts.push(text);
            }
        });

        return spanTexts;
    }

    const openMessagePopup = (message) => {
        const buttons = document.getElementsByTagName("button");
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            if (button.innerText.toLowerCase().includes('message')) {
                button.click();

                // Esperando que se muestre el popup de linkedin antes de meter el mensaje
                setTimeout(() => {
                    const messageBox = document.querySelector('div.msg-form__contenteditable.t-14.t-black--light.t-normal.flex-grow-1.full-height.notranslate');
                    const placeholderDiv = document.querySelector('div.msg-form__placeholder.t-14.t-black--light.t-normal');
                    messageBox.setAttribute('data-artdeco-is-focused', 'true');
                    placeholderDiv.classList.remove('msg-form__placeholder');
                    messageBox.click();
                    messageBox.innerHTML = `<p>${message}</p>`
                    handleSendMessageFromLinkedin();
                }, 1000);
                break;
            }
        }
    };

    const handleSendMessageFromLinkedin = () => {
        const sendMessageLinkedInButton = document.getElementsByClassName('msg-form__send-button')[0];
        const sendMessageHandler = () => {
            // TODO enviar request al backend para guardar el candidato en DB
            console.log(`Sending profile ${JSON.stringify(currentProfile)} to backend`);
        };

        sendMessageLinkedInButton.addEventListener('click', sendMessageHandler);
    };
})();
