This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Query used in Supabase for finding celebrities

```sql
CREATE
OR REPLACE FUNCTION find_similar_celebrities (
  query_embedding vector (1536),
  similarity_threshold FLOAT,
  match_count INT
) RETURNS TABLE (
  id BIGINT,
  first_name TEXT,
  last_name TEXT,
  image TEXT,
  occupation TEXT,
  age SMALLINT,
  hobbies text[],
  country_of_origin TEXT,
  bio TEXT,
  similarity FLOAT
) LANGUAGE plpgsql AS $$
begin
    return query
    select
        celebrities.id,
        celebrities.first_name,
        celebrities.last_name,
        celebrities.image,
        celebrities.occupation,
        celebrities.age,
       celebrities.hobbies,
        celebrities.country_of_origin,
        celebrities.bio,
        1 - (celebrities.embeddings <=> query_embedding) as similarity
    from
        celebrities
    where
        1 - (celebrities.embeddings <=> query_embedding) > similarity_threshold
    order by
        celebrities.embeddings <=> query_embedding
    limit
        match_count;
end;
$$;
```
