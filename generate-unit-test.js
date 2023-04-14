#!/usr/bin/env node
// generate-unit-test.js

// includes
const fs = require('fs');
const path = require('path');
const { Configuration, OpenAIApi } = require("openai");

// get key from file
const openaiKeyFilePath = './openai-key.txt';
const apiKey = fs.readFileSync(openaiKeyFilePath, 'utf8').trim();
if (!apiKey) {
  console.log(`Error: Cannot read OpenAI API key from file '${openaiKeyFilePath}'`);
  process.exit(1);
}

// get code from file
if (process.argv.length <= 2) {
  console.log('Usage: node generate-unit-test.js </path/to/file>');
  process.exit(1);
}
const filePath = process.argv[2];
try {
  fs.accessSync(filePath, fs.constants.R_OK);
} catch (err) {
  console.log(`Error: Cannot read file '${filePath}'`);
  process.exit(1);
}
let code = fs.readFileSync(filePath, 'utf8');
code = code.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm,'') // strip comments
code = code.trim();
if (!code) {
  console.log(`Error: File '${filePath}' is empty`);
  process.exit(1);
}
const fileName = path.basename(filePath);

// create openai prompt
const prompt = `
create a jest unit test with 100% branch and code coverage, and edge-cases
use eslint airbnb-base rules
filename:${fileName}
code: ${code}`;
const model = "text-davinci-003"
const temperature = 0.0; // 0:deterministic. 1:random
const max_tokens = 1024;
const top_p = 1;

const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

async function createCodeOverview() {

  try {
    const completion = await openai.createCompletion({ prompt, model, temperature, max_tokens, top_p });

    // Save the overview to a file
    let overview = completion.data.choices[0].text;
    overview = overview.trim();
    overview = `${overview}\n`;
    const filePathParsed = path.parse(filePath);
    const outputFilePath = path.format({
      dir: filePathParsed.dir,
      name: filePathParsed.name,
      ext: '.test.ts',
    });
    fs.writeFileSync(outputFilePath, overview);
    console.log(`Unit Test saved to ${outputFilePath}`);

  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

createCodeOverview();
