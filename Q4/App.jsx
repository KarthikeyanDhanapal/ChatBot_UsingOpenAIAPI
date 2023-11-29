import React,{ useState, useEffect } from "react";
import "./App.css";
import { OpenAI } from "openai";
//import XLSX from "xlsx"; // Import XLSX library for Excel file parsing
import * as XLSX from "xlsx/dist/xlsx.full.min.js";
//import { cosineSimilarity } from "sklearn.metrics.pairwise";
import { Matrix } from "ml-matrix"; 

const openai = new OpenAI({ apiKey: "MYKEY", dangerouslyAllowBrowser: true});

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [embeddings, setEmbeddings] = useState([]);

  useEffect(() => {
    // Fetch embeddings from the Excel file
    const workbook = XLSX.read("./src/Embeddings.xlsx");
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Assuming the first row contains column headers 'Text' and 'Embeddings'
    const [header, ...rows] = data;
    const embeddingsData = rows.map((row) => ({
      Text: row[0], // Assuming 'Text' is in the first column
      Embeddings: JSON.parse(row[1]), // Assuming 'Embeddings' is in the second column
    }));
    setEmbeddings(embeddingsData);
  }, []);

  const calculateSimilarity = (input) => {
   // Calculate cosine similarity using ml-matrix
   const inputVector = new Matrix([input]);
   const similarities = embeddings.map((item) => {
     const itemVector = new Matrix([item.Embeddings]);
     const similarity = inputVector.cosineSimilarity(itemVector);
     return { Text: item.Text, Similarity: similarity };
    });

    // Sort by similarity in descending order
    similarities.sort((a, b) => b.Similarity - a.Similarity);

    // Return the most similar response
    return similarities[0].Text;
  };

  const chat = async (e, message) => {
    e.preventDefault();

    if (!message) return;
    setIsTyping(true);
    scrollTo(0,1e10)

    let msgs = chats;
    msgs.push({ role: "user", content: message });
    setChats(msgs);

    setMessage("");

    const embeddingsResponse = await openai.Embed.create({
      model: "text-embedding-ada-002",
      inputs: [message],
    });
    console.log("User Embeddings:", userEmbeddings);

    const userEmbeddings = embeddingsResponse.data[0].embedding;
    console.log(userEmbeddings)
    const finalUserPrompt = calculateSimilarity(userEmbeddings);

    await openai
      .chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a DKGPT. You assist me with defined Embeddings",
          },
          ...chats,
          { role: "user", content: finalUserPrompt },
        ],
      })
      .then((res) => {
        console.log(res);
        msgs.push(res.choices[0].message);
        setChats(msgs);
        setIsTyping(false);
        scrollTo(0,1e10)
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <main>
      <h1>Karthikeyan ChatBot - AI Assignment</h1>

      <section>
        {chats && chats.length
          ? chats.map((chat, index) => (
              <p key={index} className={chat.role === "user" ? "user_msg" : ""}>
                <span>
                  <b>{chat.role.toUpperCase()}</b>
                </span>
                <span>:</span>
                <span>{chat.content}</span>
              </p>
            ))
          : ""}
      </section>

      <div className={isTyping ? "" : "hide"}>
        <p>
          <i>{isTyping ? "Typing" : ""}</i>
        </p>
      </div>

      <form action="" onSubmit={(e) => chat(e, message)}>
        <input
          type="text"
          name="message"
          value={message}
          placeholder="Type a message here and hit Enter..."
          onChange={(e) => setMessage(e.target.value)}
        />
      </form>
    </main>
  );
}

export default App;