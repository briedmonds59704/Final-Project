const searchForm = document.getElementById("site-search");
const searchInput = searchForm?.querySelector('input[name="q"]');
const searchPages = [
    "index.html",
    "assignments.html",
    "policies.html",
    "contact.html"
];
let searchIndex;

if (searchForm && searchInput) {
    const results = document.createElement("section");
    results.className = "search-results";
    results.setAttribute("aria-live", "polite");
    results.setAttribute("aria-labelledby", "search-results-heading");
    results.hidden = true;
    results.innerHTML = '<h2 id="search-results-heading">Search results</h2><p class="search-status"></p><ul></ul>';

    const header = document.querySelector("header");
    const main = document.querySelector("main");
    if (header) {
        header.insertAdjacentElement("afterend", results);
    } else if (main) {
        main.insertAdjacentElement("beforebegin", results);
    }

    const status = results.querySelector(".search-status");
    const resultList = results.querySelector("ul");

    async function loadSearchIndex() {
        const pages = await Promise.all(searchPages.map(async (path) => {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Could not load ${path} (${response.status}).`);
            }

            const html = await response.text();
            const page = new DOMParser().parseFromString(html, "text/html");
            const content = page.querySelector("main")?.textContent ?? "";

            return {
                path,
                title: page.querySelector("main h1")?.textContent.trim()
                    || page.title
                    || path,
                content: content.replace(/\s+/g, " ").trim()
            };
        }));
        return pages;
    }

    function makeExcerpt(content, query) {
        const lowerContent = content.toLowerCase();
        const firstMatch = query
            .split(/\s+/)
            .map((term) => lowerContent.indexOf(term))
            .filter((index) => index >= 0)
            .sort((a, b) => a - b)[0] ?? 0;
        const start = Math.max(0, firstMatch - 70);
        const end = Math.min(content.length, start + 180);

        return `${start > 0 ? "…" : ""}${content.slice(start, end)}${end < content.length ? "…" : ""}`;
    }

    async function showSearchResults(query) {
        results.hidden = false;
        resultList.replaceChildren();

        if (!query) {
            status.textContent = "Enter a search term to find content across the site.";
            return;
        }

        status.textContent = "Searching…";

        try {
            searchIndex ??= loadSearchIndex();
            const pages = await searchIndex;
            const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
            const matches = pages
                .map((page) => {
                    const searchableText = `${page.title} ${page.content}`.toLowerCase();
                    const score = terms.reduce((count, term) => {
                        let position = 0;
                        let occurrences = 0;
                        while ((position = searchableText.indexOf(term, position)) !== -1) {
                            occurrences += 1;
                            position += term.length;
                        }
                        return count + occurrences;
                    }, 0);

                    return { ...page, score };
                })
                .filter((page) => page.score > 0)
                .sort((a, b) => b.score - a.score);

            if (matches.length === 0) {
                status.textContent = `No results found for “${query}”.`;
                return;
            }

            status.textContent = `${matches.length} page${matches.length === 1 ? "" : "s"} found for “${query}”.`;
            for (const match of matches) {
                const item = document.createElement("li");
                const link = document.createElement("a");
                const excerpt = document.createElement("p");
                const destination = new URL(match.path, document.baseURI);
                destination.searchParams.set("q", query);

                link.href = destination.href;
                link.textContent = match.title;
                excerpt.textContent = makeExcerpt(match.content || match.title, query);
                item.append(link, excerpt);
                resultList.append(item);
            }
        } catch (error) {
            searchIndex = undefined;
            status.textContent = "Search could not load site pages. Please try again.";
            console.error("Search failed to load the site index.", error);
        }
    }

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        showSearchResults(searchInput.value.trim());
    });

    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) {
        searchInput.value = initialQuery;
        showSearchResults(initialQuery.trim());
    }
}
