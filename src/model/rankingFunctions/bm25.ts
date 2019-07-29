function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/\W/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
}

type TermStats = {
  count: number;
  freq: number;
};

type Terms = Record<string, TermStats>;

type Document = {
  body: string;
  tokens: string[];
  terms: Terms; // unique terms and their counts and frequencies
  score: number;
};

export default function bestMatch(sentences: string[], query: string) {
  const documents: Document[] = [];
  const terms: Terms = {};
  const k1 = 1.2;
  const b = 0.75;

  let totalTermLength = 0;
  let avgDocLength = 0;

  function addDocument(body: string) {
    // Raw tokenized list of words
    const tokens = tokenize(body);

    const doc: Document = {
      body,
      tokens,
      terms: {},
      score: 0
    };
    documents.push(doc);

    // Re-adjust avgDocLength
    totalTermLength += doc.tokens.length;
    avgDocLength = totalTermLength / documents.length;

    // calculate term frequency
    tokens.forEach(t => {
      if (!doc.terms[t]) {
        doc.terms[t] = {
          count: 0,
          freq: 0
        };
      }
      doc.terms[t].count++;
    });

    // Then re-loop to calculate term frequency.
    // We'll also update inverse document frequencies here.
    Object.entries(doc.terms).forEach(([term, stats]) => {
      // Term Frequency for this document.
      stats.freq = stats.count / doc.tokens.length;

      // Inverse Document Frequency initialization
      if (!terms[term]) {
        terms[term] = {
          count: 0, // Number of docs this term appears in, uniquely
          freq: 0
        };
      }
      terms[term].count++;
    });
  }

  sentences.forEach(addDocument);

  // Calculate inverse document frequencies after all documents have been added.
  Object.values(terms).forEach(stats => {
    const num = documents.length - stats.count + 0.5;
    const denom = stats.count + 0.5;
    stats.freq = Math.max(Math.log10(num / denom), 0.01);
  });

  const queryTerms = tokenize(query);
  const results: Document[] = [];

  // Look at each document in turn. There are better ways to do this with inverted indices.
  documents.forEach(doc => {
    // Calculate the score for each query term
    queryTerms.forEach(s => {
      if (!terms[s]) {
        // We've never seen this term before so IDF will be 0.
        // Means we can skip the whole term, it adds nothing to the score
        // and isn't in any document.
        return;
      }

      if (!doc.terms[s]) {
        // This term isn't in the document, so the TF portion is 0 and this
        // term contributes nothing to the search score.
        return;
      }

      // The term is in the document, let's go.
      // The whole term is :
      // IDF * (TF * (k1 + 1)) / (TF + k1 * (1 - b + b * docLength / avgDocLength))

      // IDF is pre-calculated for the whole docset.
      const idf = terms[s].freq;
      // Numerator of the TF portion.
      const num = doc.terms[s].count * (k1 + 1);
      // Denomerator of the TF portion.
      const denom =
        doc.terms[s].count +
        k1 * (1 - b + (b * doc.tokens.length) / avgDocLength);

      // Add this query term to the score
      doc.score += (idf * num) / denom;
    });

    if (doc.score) {
      results.push(doc);
    }
  });

  return results.sort((d1, d2) => d2.score - d1.score).map(d => d.body);
}

// console.log(bestMatch(text, "save the clock"));
