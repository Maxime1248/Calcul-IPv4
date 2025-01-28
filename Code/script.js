// Fonction pour changer le thème

function changeTheme() {
    var body = document.body;
    var themeText = document.querySelector('.texte-du-theme');
    var themeImage = document.querySelector('.image-du-theme');

    if (themeText && themeImage) { // Vérifiez si les éléments existent
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            themeText.innerHTML = "Light Mode";
            themeImage.setAttribute("src", "Image/lightmode.png");
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            themeText.innerHTML = "Dark Mode";
            themeImage.setAttribute("src", "Image/darkmode.png");
        }
    } else {
        console.error('L\'élément texte-du-theme ou image-du-theme n\'a pas été trouvé.');
    }
}


// Eviter la soumission automatique du formulaire
document.getElementById('formulaire').addEventListener('submit', function (event) {
    event.preventDefault();
});

function blockTextInputIP(event) {
    // Empêcher la saisie de texte dans le formulaire
    event.target.value = event.target.value.replace(/[^0-9.]/g, '');
}

function blockTextInputMask(event) {
    // Empêcher la saisie de texte dans le formulaire
    event.target.value = event.target.value.replace(/[^0-9./]/g, '');
}

// Ajouter l'écouteur d'événement aux champs de saisie
document.getElementById('formulaire_ipAddress').addEventListener('input', blockTextInputIP);
document.getElementById('formulaire_subnetMask').addEventListener('input', blockTextInputMask);


// Fonction pour convertir une adresse IP en tableau d'octets
function ipToArray(ip) {
    return ip.split('.').map(Number);
}

// Fonction pour convertir un masque CIDR en masque de sous-réseau
function cidrToMask(cidr) {
    const mask = [];
    for (let i = 0; i < 4; i++) {
        const octet = Math.min(8, cidr);
        mask.push(256 - Math.pow(2, 8 - octet));
        cidr -= octet;
    }
    return mask;
}

// Fonction pour convertir un masque en CIDR
function maskToCidr(mask) {
    const octets = mask.split('.').map(Number);
    let cidr = 0;
    for (let octet of octets) {
        cidr += ((octet >>> 0).toString(2).match(/1/g) || []).length;
    }
    return `/${cidr}`;
}

// Fonction pour vérifier si une adresse IP est valide
function validateIp(ip) {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipPattern.test(ip) && ip.split('.').every(octet => octet >= 0 && octet <= 255);
}

// Fonction pour vérifier si un masque CIDR est valide
function validateCidr(cidr) {
    const cidrPattern = /^\/([0-9]|[1-2][0-9]|3[0-2])$/;
    return cidrPattern.test(cidr);
}

// Fonction pour vérifier si un masque subnet est valide
function validateSubnetMask(mask) {
    const maskPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!maskPattern.test(mask)) return false;
    const parts = mask.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255 && (part === 0 || part === 128 || part === 192 || part === 224 || part === 240 || part === 248 || part === 252 || part === 254 || part === 255));
}

// Fonction pour calculer l'adresse réseau, la première adresse, la dernière adresse et l'adresse de broadcast
function calculateNetworkInfo(ip, mask) {
    const networkAddress = ip.map((octet, index) => octet & mask[index]);
    const broadcastAddress = ip.map((octet, index) => octet | (~mask[index] & 255));

    // Ajuster l'adresse de diffusion pour s'assurer que les valeurs sont bien entre 0 et 255
    for (let i = 0; i < broadcastAddress.length; i++) {
        if (broadcastAddress[i] > 255) {
            broadcastAddress[i] = 255;
        }
    }

    const firstAddress = networkAddress.slice();
    firstAddress[3] += 1;

    const lastAddress = broadcastAddress.slice();
    lastAddress[3] -= 1;

    const totalAddresses = Math.pow(2, 32 - mask.reduce((acc, octet) => acc + ((octet >>> 0).toString(2).match(/1/g) || []).length, 0));

    const cidr = mask.reduce((acc, octet) => acc + ((octet >>> 0).toString(2).match(/1/g) || []).length, 0);
    const invertedMask = mask.map(octet => ~octet & 255);

    return {
        cidr: `/${cidr}`,
        networkMask: mask.join('.'),
        invertedMask: invertedMask.join('.'),
        networkAddress: networkAddress.join('.'),
        firstAddress: firstAddress.join('.'),
        lastAddress: lastAddress.join('.'),
        broadcastAddress: broadcastAddress.join('.'),
        totalAddresses: totalAddresses
    };
}

// Fonction principale pour effectuer les calculs et afficher les résultats
function calculate() {
    const ip = document.getElementById('formulaire_ipAddress').value;
    const subnetMask = document.getElementById('formulaire_subnetMask').value;

    if (!ip) {
        alert("Veuillez entrer une adresse IP.");
        return;
    }

    if (!subnetMask) {
        alert("Veuillez entrer un masque de sous-réseau.");
        return;
    }

    if (!validateIp(ip)) {
        alert("Veuillez entrer une adresse IP valide (par exemple 192.168.50.3).");
        return;
    }

    let ipArray = ipToArray(ip);

    let maskArray;
    if (subnetMask.startsWith('/')) {
        if (!validateCidr(subnetMask)) {
            alert("Veuillez entrer un masque CIDR valide (par exemple /24).");
            return;
        }
        maskArray = cidrToMask(Number(subnetMask.slice(1)));
    } else {
        if (!validateSubnetMask(subnetMask)) {
            alert("Veuillez entrer un masque de sous-réseau valide (par exemple 255.255.255.0).");
            return;
        }
        maskArray = ipToArray(subnetMask);
    }

    const networkInfo = calculateNetworkInfo(ipArray, maskArray);
    console.log('Network Info:', networkInfo);

    //Affichage des résultats
    document.getElementById('cidr').innerHTML = `
        ${networkInfo.cidr}
    `;
    document.getElementById('mask').innerHTML = `
        ${networkInfo.networkMask}
    `;
    document.getElementById('invertedmask').innerHTML = `
        ${networkInfo.invertedMask}
    `;
    document.getElementById('networkaddress').innerHTML = `
        ${networkInfo.networkAddress}
    `;
    document.getElementById('firstaddress').innerHTML = `
        ${networkInfo.firstAddress}
    `;
    document.getElementById('lastaddress').innerHTML = `
        ${networkInfo.lastAddress}
    `;
    document.getElementById('broadcastaddress').innerHTML = `
        ${networkInfo.broadcastAddress}
    `;
    document.getElementById('ttladdresses').innerHTML = `
        ${networkInfo.totalAddresses}
    `;
}

function resetForm() {
    // Réinitialisation des champs de saisie
    document.getElementById('formulaire_ipAddress').value = '';
    document.getElementById('formulaire_subnetMask').value = '';

    // Réinitialisation des résultats
    document.getElementById('cidr').innerHTML = '';
    document.getElementById('mask').innerHTML = '';
    document.getElementById('invertedmask').innerHTML = '';
    document.getElementById('networkaddress').innerHTML = '';
    document.getElementById('firstaddress').innerHTML = '';
    document.getElementById('lastaddress').innerHTML = '';
    document.getElementById('broadcastaddress').innerHTML = '';
    document.getElementById('ttladdresses').innerHTML = '';
}

document.getElementById('formulaire_Reset').addEventListener('click', resetForm)
document.getElementById('formulaire_Calculer').addEventListener('click', calculate)