const CLE_API = "45b221ed8ab3aefc7a9739c9";

const inputMontant = document.getElementById("saisie-montant");
const selectSource = document.getElementById("devise-source");
const selectCible = document.getElementById("devise-cible");
const boutonInverser = document.getElementById("inverser");
const zoneAffichage = document.getElementById("affichage");
const ligneTaux = document.getElementById("ligne-taux");
const boutonActualiser = document.getElementById("actualiser");
const zoneEtat = document.getElementById("etat");
const statusBadge = document.getElementById("status-badge");
const listeHistorique = document.getElementById("liste-historique");
const boutonViderHistorique = document.getElementById("vider-historique");
const emptyHistory = document.getElementById("empty-history");

let tousLesTaux = {};
let deviseDeBase = "EUR";
let historique = [];

// Démarrage
chargerTaux(deviseDeBase);
chargerHistorique();
inputMontant.value = "1000";
calculer();

// Charger les taux depuis l'API
async function chargerTaux(devise) {
  zoneEtat.textContent = "Chargement...";
  statusBadge.classList.remove("active");

  try {
    const reponse = await fetch(`https://v6.exchangerate-api.com/v6/${CLE_API}/latest/${devise}`);
    const data = await reponse.json();

    if (data && data.result === "success") {
      tousLesTaux = data.conversion_rates;
      deviseDeBase = devise;

      zoneEtat.textContent = "Taux à jour";
      statusBadge.classList.add("active");
      peuplerSelects();
      calculer();
    } else {
      afficherErreur("Problème avec l'API", "Impossible de récupérer les taux");
    }
  } catch (erreur) {
    afficherErreur("Erreur réseau", "Vérifiez votre connexion");
  }
}

// Peupler les listes déroulantes
function peuplerSelects() {
  const devises = Object.keys(tousLesTaux).sort();
  const sourceActuelle = selectSource.value;
  const cibleActuelle = selectCible.value;
  
  selectSource.innerHTML = "";
  selectCible.innerHTML = "";

  devises.forEach(devise => {
    const opt1 = new Option(devise, devise);
    const opt2 = new Option(devise, devise);
    selectSource.add(opt1);
    selectCible.add(opt2);
  });

  selectSource.value = sourceActuelle || deviseDeBase;
  selectCible.value = cibleActuelle || (deviseDeBase === "USD" ? "EUR" : "USD");
}

// Calculer la conversion
function calculer() {
  const texte = (inputMontant.value || "").toString().replace(",", ".");
  const montant = parseFloat(texte);

  if (!montant || montant <= 0) {
    zoneAffichage.textContent = "Saisissez un montant pour commencer";
    ligneTaux.textContent = "—";
    return;
  }

  const source = selectSource.value;
  const cible = selectCible.value;

  if (!tousLesTaux[source] && source !== deviseDeBase) {
    afficherErreur("Taux indisponibles", "Devise source non disponible");
    return;
  }
  if (!tousLesTaux[cible]) {
    afficherErreur("Taux indisponibles", "Devise cible non disponible");
    return;
  }

  let taux;
  if (source === deviseDeBase) {
    taux = tousLesTaux[cible];
  } else {
    const tauxSourceVersBase = 1 / tousLesTaux[source];
    const tauxBaseVersCible = tousLesTaux[cible];
    taux = tauxSourceVersBase * tauxBaseVersCible;
  }

  const result = montant * taux;
  
  zoneAffichage.textContent = `${formatNombre(result)} ${cible}`;
  ligneTaux.textContent = `1 ${source} = ${formatNombre(taux, 4)} ${cible}`;

  ajouterAuHistorique(montant, source, result, cible);
}

// Formater les nombres
function formatNombre(nombre, decimales = 2) {
  return nombre.toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
}

// Afficher une erreur
function afficherErreur(titre, message) {
  zoneEtat.textContent = titre;
  statusBadge.classList.remove("active");
  zoneAffichage.textContent = message;
  ligneTaux.textContent = "—";
}

// Gestion de l'historique
function chargerHistorique() {
  historique = [];
  afficherHistorique();
}

function ajouterAuHistorique(montant, source, result, cible) {
  const maintenant = new Date();
  const dateFormatee = maintenant.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const entree = {
    date: dateFormatee,
    montant: montant,
    source: source,
    result: result,
    cible: cible
  };

  historique.unshift(entree);

  if (historique.length > 10) {
    historique = historique.slice(0, 10);
  }

  afficherHistorique();
}

function afficherHistorique() {
  listeHistorique.innerHTML = "";

  if (historique.length === 0) {
    emptyHistory.style.display = "block";
    return;
  }

  emptyHistory.style.display = "none";

  historique.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <time>${item.date}</time>
      <span>${formatNombre(item.montant)} ${item.source} → ${formatNombre(item.result)} ${item.cible}</span>
    `;
    listeHistorique.appendChild(li);
  });
}

function viderHistorique() {
  historique = [];
  afficherHistorique();
}

// Événements
inputMontant.addEventListener("input", calculer);

selectSource.addEventListener("change", function () {
  if (selectSource.value !== deviseDeBase) {
    chargerTaux(selectSource.value);
  } else {
    calculer();
  }
});

selectCible.addEventListener("change", calculer);

boutonInverser.addEventListener("click", function () {
  const temp = selectSource.value;
  selectSource.value = selectCible.value;
  selectCible.value = temp;
  
  if (selectSource.value !== deviseDeBase) {
    chargerTaux(selectSource.value);
  } else {
    calculer();
  }
});

boutonActualiser.addEventListener("click", function () {
  chargerTaux(selectSource.value);
});

boutonViderHistorique.addEventListener("click", viderHistorique);