const FILE = "./skill.json";
const uuid = require("uuid");
let json = require(FILE);
const fs = require("fs");
// pequeño filtro para borrar previos faqs
json.intents = json.intents.filter((el) => !el.intent.includes("faq_"));
let intentsJSON = json.intents;
let dialogNodes = json.dialog_nodes;
let insertedIntents = [];
let faqNode = searchNodeByTitle("FAQ", dialogNodes);

let lastNodeId;

const { GoogleSpreadsheet } = require("google-spreadsheet");
const {
  formatIntentName,
  formatTrainingPhrases,
  removeBreakLines,
} = require("./utils");

// Initialize the sheet - doc ID is the long id in the sheets URL
const doc = new GoogleSpreadsheet(
  "16go5e_QvO23ChO6kh9IxmBUZByK9DkR4R0OiNvmtsR4"
);

let failed = [];

(async () => {
  // Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
  await doc.useServiceAccountAuth({
    client_email: "spreadsheet@databot-324620.iam.gserviceaccount.com",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCLS+s+hUviO98b\nuGUNOlL2TeeAEpZIFyzgFmEi/2bDLdQfs8byDmqRnZqY7dHUrqMhusQEjWVyPa1T\ncCeTllpQyAlFmhDWeQAK7mGzhge0OwNed6ZvEpCsIEEOuvMUwd19/Wf6CCxMbGgq\ndKYx2SpeLjzrA/Io/BwEqSrJwsWtE9PQ8zuGSCi3Z5IprFqAARfmsyo0v6whtXyp\n5tA9JgVfJN+QMyuHcUUQfaYeyiqP8Ft5jO08/pWpRQjXeGQyV4pJviSBVHPkaNnt\nAUtmV+JByHzwe7CMQ6ERSafXoZtyZI4FRwcYbDodywxPIhfnuzzUL2yi8NMq7V6m\nzckfW12/AgMBAAECggEAA31Hq52RZl22lVsVcoyuYFiL2IordPhAc23MFoel7nS6\n8BjD5PNi5jpRXmXytpLk9KbZJ/4JkQa/gHjgqbjl+UkRhmQft0FGGxmYNycmRHSh\nlt+4OrPd2oBfJAkF2geQAb4NbHBNxi2FbHujxox/AoEpA7NQTe66BI0STJ/FVBqp\nSCgdcz8mBw+nIfpOp/XIiPFODh/JFDo9B97DMusTWkSIXQb+D87Ky/WqIx/W4lwu\np0sIc25ZLG0JCUNsgos90xxxlkCuCpE0jGbEb93E/ASrbRD6ev1vyej9yQ/wyAdY\naGLhABoJzZ0YilncddftoeqrbpTNM3rPlkQyA9gbpQKBgQDCchpwx80xUAzJJFhT\np6AgSFmv37STfjoaRHqGkVYohppWccsExOHA0s/eZbC7aY2Exlq+FSpurJNuGG46\nCDH8OTHLOzC9kUJOTNnGBxV6s/OppStyOPGlHwi0LpBR/+ShYozNXVrWmBl8sU5h\n+OQhGeCPOa4KUIzNqzXLxqx19QKBgQC3ZIX9KgOR/0E+b4+mvzxasjmi1v53Bku8\noo0KBWawPc7onsO7+Zz5H1b4nFUz/OmQsEg6B6jFLCjG0F7TlBTf7DxWm6jx3pDM\nNpVTN8aBaP2od/ULeszxZdIo92/W8sS3tMF2iH3rXZJJlBCuCrkwHf9gc6gVU7GI\nkNe9OCrAYwKBgBjWIEB1lOUOl4N9q/aLe62D8EjBpzwLrHo8cvYLTFkC0GXoRQlH\n6JoLk1eR36AgnF3wRBjxdSkLzA0M+89XyqKv34dY+SHNkw2TTWG49+pjX+U0XrdJ\nRLxVmXQCWpbOu7JNdzSoDvlIFkFSGHP1KZZ8yq0grfVNUp7Wlpl/t/mdAoGARYm2\nTKJrrCZPhO8kVyPYLMO7mwVOg689dI9mT1Bw+Y7WL9pTealSXhwGDEqq/AWAQr61\nBFv3IJx38br82dkieS3IS0bGrr+nw+dGg8F4YYV/+StTHUE5CKeFIsd//s8azFWb\nrehfZqmaWI/uKzAhvB8DwHzaVQvhG1lglH0BqOUCgYAO1exH9wnQFwS7xPWm11tT\n3bO2/RzN8iv7ks141DGKBAGIbvvvd384oXTDu8oTDisfW1j0/6Jh0dxna8n3PaRS\n5bmJLB2Ug5Tzi+o5KXfSMXHWChvddvL+0w3EewKqW6L2yvqz4sLKE3CRuFGsYeWv\nAB7OhupgjArmBDi4dbpGww==\n-----END PRIVATE KEY-----\n",
  });

  await doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);

  const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
  const rows = await sheet.getRows(); // can pass in { limit, offset }
  // empezando a generar conocimiento del bot
  let intents = generateRawKnowledge(rows);
  console.log("🚀 Aqui *** -> intents", intents);
  createKnowledge(intents);
})();

function searchNodeByTitle(title, nodes) {
  return nodes.find(
    (el) => el.title && el.title.toLowerCase() == title.toLowerCase()
  );
}

function generateRawKnowledge(rows) {
  let intents = [];
  for (const row of rows) {
    let intentName = row["Intención o Pregunta"];
    let phrase = row["Frases para Entrenamiento"];
    let response = row["Respuesta"];
    let intent = {
      name: "",
      phrases: [],
      responses: [],
    };
    if (intentName) {
      // empieza nuevo intent
      intent.name = intentName;
      // agregando frase de entrenamiento
      if (phrase && phrase !== "") {
        intent.phrases.push(phrase);
      }
      // agregando respuesta
      if (response && response.trim() != "Respuesta") {
        intent.responses.push(response);
      }
      intents.push(intent);
    } else {
      if (intents.length > 0) {
        // pushear phrases y responses
        if (phrase && !intents[intents.length - 1].phrases.includes(phrase)) {
          intents[intents.length - 1].phrases.push(phrase);
        }
        // si existe respuesta, pushear
        if (response && response.trim() != "Respuesta") {
          intents[intents.length - 1].responses.push(response);
        }
      }
    }
  }
  return intents;
}

async function createKnowledge(intents) {
  let count = 1;
  for (const intent of intents) {
    // CONDICIONES PROPIAS DEL USUARIO DEL BOT
    let formattedIntentName = formatIntentName(intent.name, "faq");
    // hay que dar formato Watson a cada training phrase
    let cleanPhrases = formatTrainingPhrases(intent.phrases);
    // los ejemplos no deben superar 1024 caracteres [http://watson-developer-cloud.github.io/python-sdk/v1.3.1/apis/watson_developer_cloud.assistant_v1.html]
    // limpiamos las que tengan texto = ''
    cleanPhrases = cleanPhrases.filter(
      (el) => el.text && el.text.length <= 1024
    );
    if (cleanPhrases.length > 0) {
      insertedIntents.push(formattedIntentName);
      generateIndividualKnowledge(
        formattedIntentName,
        cleanPhrases,
        intent,
        intent.name
      );
    }
    count += 1;
  }
  fs.writeFileSync(FILE, JSON.stringify(json, null, 2));
  console.log("LOS ERRORES: ", failed);
  console.log("FIN!");
}
function generateIndividualKnowledge(
  formattedIntentName,
  cleanPhrases,
  intent,
  intentName
) {
  try {
    console.log("AGREGANDO NUEVO: ", formattedIntentName);
    dialogNodes.unshift(
      newDialogNode(
        removeBreakLines(intentName).trim(),
        [
          ...intent.responses.map((el) => ({
            values: [
              { text: el.replace(/@/g, "\\@").replace(/\$/g, "\\$").trim() },
            ], // reemplazando simbolos reservados watson
            response_type: "text",
            selection_policy: "sequential",
          })),
          {
            values: [
              {
                text: "¿En qué más puedo ayudarte?",
              },
              {
                text: "¿Qué más puedo hacer por ti?",
              },
              {
                text: "¿En qué otras consultas te puedo apoyar?",
              },
            ],
            response_type: "text",
            selection_policy: "random",
          },
        ],
        faqNode.dialog_node,
        {
          pregunta: "<?input.text?>",
        },
        `(#${formattedIntentName} || $intent_name=='${formattedIntentName}') && intents[0].confidence>$threshold_faq`
      )
    );
    intentsJSON.unshift(
      newIntent(
        formattedIntentName,
        cleanPhrases,
        intentName.replace(/\r?\n|\r/g, "")
      )
    ); // se usa como descripcion el nombre
  } catch (error) {
    console.log("error dentro..", {
      formattedIntentName,
      cleanPhrases,
      intent,
    });
    failed.push({ formatted: formattedIntentName, name: intent.name });
  }
}

function newIntent(name, examples = [], description) {
  return {
    intent: name.substring(0, 127),
    examples,
    description: description.substring(0, 127),
  };
}

function newDialogNode(title, generics = [], parent, context, conditions) {
  let nodeId = uuid.v4();

  let payload = {
    type: "standard",
    title: title.substring(0, 127),
    output: {
      generic: generics,
    },
    parent,
    context,
    conditions,
    dialog_node: nodeId,
  };
  if (lastNodeId) {
    payload.previous_sibling = lastNodeId;
  }
  lastNodeId = nodeId;

  return payload;
}
