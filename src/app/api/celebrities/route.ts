import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseClient } from "@/lib/utils/supabase-client";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchTerm = url.searchParams.get("searchTerm");

  if (!searchTerm || searchTerm.trim() === "") {
    return NextResponse.json({
      error: "Missing required parameter 'searchTerm'",
      status: 400,
    });
  }

  const openAiEmbeddings = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: searchTerm,
  });

  const { embedding } = openAiEmbeddings.data[0]; // this is the vector representation of the search term

  const { data, error } = await supabaseClient.rpc("find_similar_celebrities", {
    // find_similar_celebrities is a stored procedure in Supabase. Refer to Readme for exact query
    query_embedding: embedding,
    similarity_threshold: 0.2, // How much similarity is required to consider a match. The higher the value, the more similar the results should be.
    match_count: 2, // How many matches/ records to return
  });

  if (error) {
    console.error("Error fetching data from Supabase:", error);
    return NextResponse.error();
  }

  return NextResponse.json({
    status: 200,
    success: true,
    results: data,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { celebrities } = body;

  // Function to generate OpenAI embeddings for a given text
  async function generateOpenAIEmbeddings(profile: any) {
    const textToEmbed = Object.values(profile).join(" ");
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: textToEmbed,
    });
    return response.data[0].embedding;
  }
  try {
    // Map over the array and process each item
    const processedDataArray = await Promise.all(
      celebrities.map(async (item: any) => {
        // Generate OpenAI embeddings for the entire profile object
        const embeddings = await generateOpenAIEmbeddings(item);
        // Modify the item to add an 'embeddings' property
        const modifiedItem = { ...item, embeddings };

        // Post the modified item to the 'profiles' table in Supabase
        const { data, error } = await supabaseClient
          .from("celebrities")
          .upsert([modifiedItem]);

        // Check for errors
        if (error) {
          console.error("Error inserting data into Supabase:", error.message);
          return NextResponse.json({
            success: false,
            status: 500,
            result: error,
          });
        }

        return NextResponse.json({
          success: true,
          status: 200,
          result: data,
        });
      })
    );

    // Check if any insertions failed
    const hasError = processedDataArray.some((result) => !result.success);

    if (hasError) {
      return NextResponse.json({
        error: "One or more insertions failed",
        status: 500,
      });
    }

    // Data successfully inserted for all items

    return NextResponse.json({
      status: 200,
      success: true,
      results: processedDataArray,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error.message);
    return NextResponse.json({
      status: 500,
      success: false,
      results: error,
      message: "Internal Server Error",
    });
  }
}
