# Approach Summary

I updated the app so it gets restaurant data from Yelp and shows it in simple cards.  
I used AI-assisted development with GPT-5.3 Codex and Gemini to help build the UI faster and keep the code clean.  
It also helped me understand error messages, so I could fix issues step by step more efficiently.  
I also made the featured restaurant section update from the same search results, so the page stays consistent.  
To improve clarity for users, I added loading states and clear messages when search fails.

# Accuracy and Edge Cases

For accuracy, I map Yelp fields directly into the values shown on screen, including rating, reviews, price, and coordinates.  
I check that latitude and longitude are real numbers before showing them, and I show "Coordinates: unavailable" if missing.  
I also handle missing fields like phone, price, and image with safe fallback text or images.  
If the API key is missing or invalid, or the request fails, the app shows a clear error message instead of crashing.
