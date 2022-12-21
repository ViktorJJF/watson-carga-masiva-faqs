function formatIntentName(intentName, sufijo = "app") {
  // eliminando caracteres especiales
  let cleanIntentName = intentName
    .replace(/[`´~…!@#$%^&*()|+\-=¿?;:'",.<>\{\}\[\]\\\/]/gi, "")
    .replace(/(?:\r\n|\r|\n)/g, "")
    .replace(/\s\s+/g, " ");

  return (
    sufijo +
    "_" +
    removeAccents(cleanIntentName)
      .toLowerCase()
      .trim()
      .split(" ")
      .join("_")
      .substring(0, 127) // el nombre no puede tener mas de 128 caracteres
  );
}

function removeBreakLines(text) {
  return text.replace(/(?:\r\n|\r|\n)/g, "");
}

function removeAccents(str) {
  var accents =
    "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
  var accentsOut =
    "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
  str = str.split("");
  var strLen = str.length;
  var i, x;
  for (i = 0; i < strLen; i++) {
    if ((x = accents.indexOf(str[i])) != -1) {
      str[i] = accentsOut[x];
    }
  }
  return str.join("");
}

function removeAccentsSoft(str) {
  var accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüŠšŸÿýŽž";
  var accentsOut =
    "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuSsYyyZz";
  str = str.split("");
  var strLen = str.length;
  var i, x;
  for (i = 0; i < strLen; i++) {
    if ((x = accents.indexOf(str[i])) != -1) {
      str[i] = accentsOut[x];
    }
  }
  return str.join("");
}

function formatTrainingPhrases(phrases) {
  let cleanPhrases = [];
  for (const phrase of phrases) {
    let cleanPhrase = removeAccentsSoft(phrase)
      .replace(/\r?\n|\r/g, "")
      .toLowerCase()
      .trim();
    if (!cleanPhrases.includes(cleanPhrase)) {
      cleanPhrases.push(cleanPhrase);
    }
  }
  return cleanPhrases.map((phrase) => ({ text: phrase }));
}

function cleanEntityValue(str) {
  return str
    .replace(/\r?\n|\r/g, "")
    .replace(/[`´~…!@#$%^&*()|+\-=¿?;:'",.<>\{\}\[\]\\\/-]/gi, "");
}

module.exports = {
  formatIntentName,
  removeAccents,
  formatTrainingPhrases,
  cleanEntityValue,
  removeBreakLines,
};
