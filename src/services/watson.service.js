const {WatsonXAI} = require('@ibm-cloud/watsonx-ai')
const { IamAuthenticator } = require('ibm-cloud-sdk-core')



// config do .env
const SERVICE_URL = process.env.WATSONX_URL
const PROJECT_ID = process.env.WATSONX_PROJECT_ID
const VERSION = '2024-02-15'
const APIKEY = process.env.WATSONX_APIKEY

// Criar cliente
const wx = WatsonXAI.newInstance({
    version: VERSION,
    serviceUrl: SERVICE_URL,
    authenticator: new IamAuthenticator({
        apikey: APIKEY
    }),
    disableSslVerification: true, // <— só use em DEV
})

/**
 * Gera texto a partir de um prompt simples usando Granite.
 * @param {string} prompt - texto de entrada
 * @param {object} [opts] - opções (ex.: max_new_tokens)
 */

async function generateText(prompt, opts = {}){
    const parameters = {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.9,
    }

    const params = {
    input: prompt,
    modelId: 'ibm/granite-13b-instruct-v2',
    projectId: PROJECT_ID,
    parameters,
  };

  const res = await wx.generateText(params);

   return res?.result?.results?.[0]?.generated_text ?? '';
}


module.exports = { generateText };