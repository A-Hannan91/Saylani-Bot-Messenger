const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const dialogflow = require("@google-cloud/dialogflow");
const { WebhookClient, Payload } = require("dialogflow-fulfillment");
const express = require("express");
const nodemailer = require("nodemailer");
const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = "AIzaSyBxJHIpZoF1AYOts7oX-KFQE7Rcbvq3pVY";

async function runChat(queryText) {
  const genAI = new GoogleGenerativeAI(
    "AIzaSyBxJHIpZoF1AYOts7oX-KFQE7Rcbvq3pVY"
  );
  console.log(genAI);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 1,
    top_p: 0.95,
    top_k: 64,
    max_output_tokens: 60,
    response_mime_type: "text/plain",
  };

  const chat = model.startChat({
    generationConfig,
    history: [],
  });

  const result = await chat.sendMessage(queryText);
  const response = result.response;
  return response.text();
}

const webApp = express();
const PORT = process.env.PORT || 5450;
webApp.use(
  express.urlencoded({
    extended: true,
  })
);
webApp.use(express.json());
webApp.use((req, res, next) => {
  console.log(`Path ${req.path} with Method ${req.method}`);
  next();
});

// webApp.get;

webApp.get("/", (req, res) => {
  res.sendStatus(200);
  res.send("Status Okay");
});

webApp.post("/dialogflow", async (req, res) => {
  var id = res.req.body.session.substr(43);
  console.log(id);
  const agent = new WebhookClient({
    request: req,
    response: res,
  });

  function about(agent) {
    console.log(`intent  =>  About Saylani`);
    agent.add(
      "Saylani Welfare International Trust has been working for the last 22 years to improve the conditions of the less privileged, helpless, and handicapped individuals. The organization is working day and night to make life happier, especially for the middle class, lower middle class and even lower class."
    );
  }

  function registration(agent) {
    const { city, name, age, CNICnumber, email, phone, address } =
      agent.parameters;
    console.log(`intent  =>  Student-Data-Registration`);

    const accountSid = "AC4dcacf54f528a27d05a84b450ba99872";
    const authToken = "";
    const client = require("twilio")(accountSid, authToken);

    agent.add("We have received all your details, please check your email");

    client.messages
      .create({
        body: `Hello Dear ${name}! We have received your details with your city ${city}, your age ${age}, your CNIC No. ${CNICnumber} email ${email}, your contact number ${phone} and your address ${address}. Thank you for your registration at SMIT.`,
        from: "+14795527234",
        to: "+923211555007",
      })
      .then((message) => console.log(message.sid));

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "a.hannan91@gmail.com",
        pass: "bqgnqtsqzlrawpev",
      },
    });

    var mailOptions = {
      from: "a.hannan91@gmail.com",
      to: email + "hammadn788@gmail.com",
      subject: "Thank you for your registration at SMIT",
      text: `Hello Dear ${name}! We have received your details with your city ${city}, your age ${age}, your CNIC No. ${CNICnumber} email ${email}, your contact number ${phone} and your address ${address}. Thank you for your registration at SMIT.`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }

  async function Fallback() {
    let action = req.body.queryResult.action;
    let queryText = req.body.queryResult.queryText;

    if (action === "input.unknown") {
      let result = await runChat(queryText);
      agent.add(result);
      console.log(result);
    } else {
      agent.add(result);
      console.log(result);
    }
  }

  let intentMap = new Map();
  intentMap.set("About Saylani", about);
  intentMap.set("Student-Data-Registration", registration);
  intentMap.set("Default Fallback Intent", Fallback);
  agent.handleRequest(intentMap);
});

webApp.listen(PORT, () => {
  console.log(`Server is up and running at http://localhost:${PORT}/`);
});
