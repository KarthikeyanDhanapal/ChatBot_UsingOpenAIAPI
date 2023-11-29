import openai
import pandas as pd
import pdfplumber
#df = pd.DataFrame()
# Set your OpenAI API key
openai.api_key = "MYKEY"

def process_pdf(pdf_path):
    # Extract text from the PDF file
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()

    print(text)
    text = text.replace("\n", " ")
    # Create embeddings for the text
    model="text-embedding-ada-002"
    #embeddings = openai.Embedding.create(input=text)
    #Embed1 = openai.Embedding.create(input = text, model=model,max_tokens=2).data[0].embedding
    #Embed1 = openai.Embedding.create(input = "I love Gardening", model=model,max_tokens=2).data[0].embedding

    # Create embeddings for the text
    model = "text-embedding-ada-002"
    response = openai.Embedding.create(model=model, messages=[{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": text}], input=[text])
    print(response)
    #Embed1 = response['choices'][0]['message']['content']['embedding']
    Embed1 = response['data'][0]['embedding']
    
    print(Embed1)

    # Create a DataFrame to store the embeddings
    #df = pd.DataFrame([Embed1], columns=[f'embedding_{i+1}' for i in range(len(Embed1))])

    #print(df)
    # Save the DataFrame to an Excel file
    #df.to_excel("embeddings.xlsx", index=False)
    # Create a DataFrame to store the text and embeddings
    df = pd.DataFrame({'Text': [text], 'Embeddings': [Embed1]})
    return df
def process_multiple_pdfs(pdf_files):
    # Create an empty DataFrame to store results
    result_df = pd.DataFrame(columns=['Text', 'Embeddings'])

    # Process each PDF file
    for pdf_file in pdf_files:
        df = process_pdf(pdf_file)
        result_df = pd.concat([result_df, df], ignore_index=True)

    # Save the DataFrame to an Excel file
    result_df.to_excel("embeddings_multiple_files.xlsx", index=False)

# Upload multiple PDF files from the user
num_pdfs = int(input("Enter the number of PDF files: "))
pdf_files = [input(f"Please upload PDF file #{i + 1}: ") for i in range(num_pdfs)]

# Process the PDF files and create embeddings
process_multiple_pdfs(pdf_files)

print("Text and embeddings for multiple PDF files created and saved to embeddings_multiple_files.xlsx")
