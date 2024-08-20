"use client";

import React, { useEffect, useState } from "react";
import CelebrityProfileCard from "./celebrity-profile-card";
import { supabaseClient } from "@/lib/utils/supabase-client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { celebrities } from "@/data/celebrities";

const Homepage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CelebrityProfile[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!searchTerm || searchTerm.trim() === "") {
      await fetchCelebrities();
      return;
    }

    toast.promise(
      async () => {
        const semanticallySimilarCelebritiesSearch = await fetch(
          `/api/celebrities?searchTerm=${searchTerm}`
        );

        const response = await semanticallySimilarCelebritiesSearch.json();

        return response;
      },
      {
        loading: "Searching...",
        success: (response) => {
          setSearchTerm("");

          const results = response.results;

          if (!results || results.length === 0) {
            return "No results found!";
          }

          setSearchResults(results);
          return "Search successful!";
        },
        error: "Error searching!",
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const fetchCelebrities = async () => {
    const { data, error } = await supabaseClient
      .from("celebrities")
      .select("*")
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Error fetching celebrities:", error.message);
    }

    if (data) {
      setSearchResults(data);
    }
  };

  // To create the data in the database with the embeddings
  const postToSetup = async () => {
    const res = await fetch("/api/celebrities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        celebrities: celebrities,
      }),
    });
    const data = await res.json();

    if (data.success) {
      toast.success("Celebrities setup successful!");
    } else {
      toast.error("Error setting up celebrities!");
    }

    fetchCelebrities();
  };

  useEffect(() => {
    fetchCelebrities();
  }, []);

  return (
    <div className="py-16 w-full flex justify-center items-center flex-col overflow-y-scroll">
      <h1 className="text-2xl tracking-tight font-light">Vector Search</h1>
      <form
        onSubmit={handleSubmit}
        className="m-16 bg-white rounded-lg shadow-md flex w-full md:w-1/2 p-4"
      >
        <input
          type="text"
          placeholder="Search..."
          className="flex-grow text-lg font-light focus:outline-none"
          value={searchTerm}
          onChange={handleChange}
        />
        <Button type="submit" className="px-4 py-2 text-white rounded-r-lg">
          Search
        </Button>
      </form>
      <div className="flex flex-wrap justify-center overflow-y-auto">
        {searchResults.map((profile, index) => (
          <CelebrityProfileCard key={index} profile={profile} />
        ))}
      </div>
      <Button
        className="px-4 py-2 text-white rounded-lg mt-8"
        onClick={postToSetup}
      >
        Setup
      </Button>
    </div>
  );
};

export default Homepage;
