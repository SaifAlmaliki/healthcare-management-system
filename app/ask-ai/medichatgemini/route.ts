// import { Message, OpenAIStream, StreamData, StreamingTextResponse } from "ai";
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {Pinecone} from '@pinecone-database/pinecone';
import {Message, StreamData, streamText} from 'ai';

import {queryPineconeVectorStore} from '@/utils';

// Allow streaming responses up to 30 seconds
export const maxDuration = 60;
// export const runtime = 'edge';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY ?? ''
});

const google = createGoogleGenerativeAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  apiKey: process.env.GEMINI_API_KEY
});

// gemini-1.5-pro-latest
// gemini-1.5-pro-exp-0801
const model = google('models/gemini-2.0-flash', {
  safetySettings: [{category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'}]
});

export async function POST(req: Request, res: Response) {
  const reqBody = await req.json();
  console.log(reqBody);

  const messages: Message[] = reqBody.messages;
  const userQuestion = `${messages[messages.length - 1].content}`;

  const reportData: string = reqBody.data.reportData;
  const query = `Represent this for searching relevant passages: patient medical report says: \n${reportData}. \n\n${userQuestion}`;

  let retrievals: string = "";
  try {
    retrievals = await queryPineconeVectorStore(pinecone, 'medic', 'ns1', query);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Pinecone index error: ' + errorMsg);
    retrievals = "No relevant clinical findings available.";
  }

  const finalPrompt = `Here is a summary of a patient's clinical report, and a user query. Some generic clinical findings are also provided that may or may not be relevant for the report.
  Go through the clinical report and answer the user query.
  Ensure the response is factually accurate, and demonstrates a thorough understanding of the query topic and the clinical report.
  Before answering you may enrich your knowledge by going through the provided clinical findings.
  The clinical findings are generic insights and not part of the patient's medical report. Do not include any clinical finding if it is not relevant for the patient's case.

  \n\n**Patient's Clinical report summary:** \n${reportData}.
  \n**end of patient's clinical report**

  \n\n**User Query:**\n${userQuestion}?
  \n**end of user query**

  \n\n**Generic Clinical findings:**
  \n\n${retrievals}.
  \n\n**end of generic clinical findings**

  \n\nProvide thorough justification for your answer.
  \n\n**Answer:**
  `;

  const data = new StreamData();
  data.append({
    retrievals
  });

  const result = await streamText({
    model,
    prompt: finalPrompt,
    onFinish() {
      data.close();
    }
  });

  return result.toDataStreamResponse({data});
}
