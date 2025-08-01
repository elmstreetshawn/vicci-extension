const fs = require("fs");
const path = require("path");
const { VertexAI } = require("@google-cloud/vertexai");

const imagePath = path.join(__dirname, "images", "pic.png");
const imageData = fs.readFileSync(imagePath).toString("base64");

const image1 = {
  inlineData: {
    mimeType: "image/png",
    data: imageData,
  },
};

const vertex_ai = new VertexAI({
  project: "aitx-hack24aus-622",
  location: "us-central1",
});
const model = "gemini-1.0-pro-vision-001";

const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 2048,
    topP: 0.4,
    topK: 32,
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
});

async function generateContent() {
  const req = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a web accessibility assistant helping a blind user. Describe the image.`,
          },
          image1,
        ],
      },
    ],
  };

  console.log("Prompt Text:");
  console.log(req.contents[0].parts[1].text);

  console.log("Non-Streaming Response Text:");
  const response = await generativeModel.generateContent(req);
  const fullTextResponse =
    response.response.candidates[0].content.parts[0].text;

  console.log(fullTextResponse);

  // IF you want to stream.
  // const streamingResp = await generativeModel.generateContentStream(req);
  // for await (const item of streamingResp.stream) {
  //   process.stdout.write("stream chunk: " + JSON.stringify(item) + "\n");
  // }
  // process.stdout.write(
  //   "aggregated response: " + JSON.stringify(await streamingResp.response)
  // );
}

await generateContent();
