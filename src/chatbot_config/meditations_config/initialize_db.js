require("dotenv").config();
const { createAndSaveEmbeddings } = require("./config_model/db_utils.js");

/*------------------------------------------------+
|=============== CALL DB FUNCTION ================|
+------------------------------------------------*/
async function main() {
  try {
    const result = await createAndSaveEmbeddings();
    return result;
  } catch (error) {
    return "Erro ao criar e salvar embeddings";
  }
}

main().then(result => {
  if (typeof result === "string" && result.toLowerCase().startsWith("erro")) {
    console.error(result);
  }
});
