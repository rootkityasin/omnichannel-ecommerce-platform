'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper to get cached model
const getModel = () => {
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
};

/**
 * Generates a professional product description using Gemini (with optional Vision).
 */
export async function generateDescriptionAI(name: string, category: string, weight: number, unit: string, imageUrl?: string) {
    try {
        const model = getModel();
        const quantity = weight > 0 ? `(${unit === 'WEIGHT' ? weight + 'g' : weight + ' units'})` : '';

        const prompt = `
# ROLE
You are a high-end Luxury Brand Copywriter and sensory psychologist. Your goal is to write a product description that triggers an immediate visceral desire (a "craving") in the shopper.

# INPUTS
- Product Name: ${name}
- Category: ${category}
- Metadata: ${quantity}
- Reference Image: [Attached]

# INSTRUCTIONS
1. VISUAL SENSORY EXTRACTION: Analyze the attached image using your native vision capabilities. Identify the "hero" visual elements—the way light hits the surface, the tactile texture (grainy, silky, matte), and the lifestyle "status" it represents.
2. THE HOOK: Start with a "Moment of Use." Don't describe the object; describe the second the customer interacts with it. (e.g., instead of "This is a soft chair," use "Sink into a cloud of Italian leather that conforms to you.")
3. PSYCHOLOGICAL TRIGGERS: 
   - Use 'Loss Aversion': Hint that their current daily routine is "lesser" without this upgrade.
   - Use 'Sensory Adjectives': Focus on "Crisp," "Velvety," "Weighted," "Luminous," or "Artisanal."
4. STRUCTURE:
   - **The Magnetic Headline**: 5-8 words max.
   - **The Transformation**: One short, punchy paragraph (2-3 sentences) about how their life changes with this product.
   - **The "Obsession" Points**: 3 bullet points. Each must start with a benefit, followed by the visual detail that proves it.
   - **The Immediate CTA**: A high-pressure, tempting closing line.

# CONSTRAINTS
- NO generic adjectives (amazing, great, high-quality).
- Use "You" and "Your" throughout.
- Max length: 150 words.
`;

        const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];

        if (imageUrl) {
            try {
                // Fetch image and convert to base64
                const imgRes = await fetch(imageUrl);
                if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
                const imgBuffer = await imgRes.arrayBuffer();
                const base64Image = Buffer.from(imgBuffer).toString('base64');

                parts.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: imgRes.headers.get('content-type') || 'image/jpeg'
                    }
                });

                // Image attached to parts automatically
            } catch (imgError) {
                console.error("Image Fetch Error:", imgError);
                // Continue without image if fetch fails
            }
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return `Premium quality ${name}. Freshly sourced ${category}, processed with care.`;
    }
}

/**
 * Translates English text to Bangla (focused on ingredients).
 */
export async function translateToBanglaAI(text: string) {
    try {
        if (!text) return null;
        const model = getModel();
        const prompt = `Translate this English food ingredient name to Bangla: "${text}". 
        Return ONLY the Bangla text. No explanations.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Translate Error:", error);
        return null;
    }
}

/**
 * Parses unstructured text into JSON using Gemini.
 */
export async function smartParseAI(text: string) {
    try {
        const model = getModel();
        const prompt = `Extract product details from this text: "${text}".
        Return a valid JSON object with these keys: 
        - name (string, remove weights/prices)
        - weight (number, in grams. Convert kg to g)
        - price (number)
        - pieces (number)
        
        Example Input: "Crab 500g 1200tk" -> {"name": "Crab", "weight": 500, "price": 1200, "pieces": 0}
        Return ONLY valid JSON. No markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanText = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini Parse Error:", error);
        return { name: text, price: 0, weight: 0, pieces: 0 };
    }
}

/**
 * Parses Excel/CSV data for customer import.
 * AI maps columns to: name, phone, email, points, history (orders/spent)
 */
export async function parseExcelCustomersAI(csvContent: string) {
    try {
        const model = getModel();
        const prompt = `You are a data mapping expert. Parse this CSV/Excel data and extract customer records.

INPUT DATA:
"""
${csvContent.substring(0, 8000)}
"""

COLUMN MAPPING RULES:
- "Full Name", "Customer Name", "Name" → name (REQUIRED - skip row if missing)
- "Phone", "Mobile", "Contact" → phone (REQUIRED - skip row if missing)  
- "Email" → email (optional, use empty string if missing)
- "Points", "Loyalty Points" → points (optional, default to 0)
- "Orders", "Total Orders", "History" → orders (optional, default to 0)
- "Spent", "Total Spent", "Amount" → spent (optional, default to 0)

INSTRUCTIONS:
1. Identify the header row and map columns intelligently
2. Parse each data row and extract customer info
3. Skip rows with missing name OR phone
4. For missing optional fields, use defaults (0 for numbers, "" for email)
5. Clean phone numbers (keep only digits, ensure BD format like 01...)

OUTPUT FORMAT (return ONLY valid JSON array, no markdown):
[
  {"name": "...", "phone": "...", "email": "...", "points": 0, "orders": 0, "spent": 0},
  ...
]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanText = response.text().replace(/```json|```/g, '').trim();

        const customers: unknown = JSON.parse(cleanText);

        if (!Array.isArray(customers)) {
            return [];
        }

        // Validate and clean
        return customers
            .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === 'object')
            .filter((c) => c.name && c.phone)
            .map((c) => ({
                name: String(c.name).trim(),
                phone: String(c.phone).replace(/\D/g, '').trim(),
                email: c.email ? String(c.email).trim() : '',
                points: Number(c.points) || 0,
                orders: Number(c.orders) || 0,
                spent: Number(c.spent) || 0
            }));
    } catch (error) {
        console.error("AI Excel Parse Error:", error);
        return [];
    }
}

