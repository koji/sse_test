import { useState, useRef, useEffect } from "react";
import { Heading, Text, Box, Flex, Button, Textarea } from "@chakra-ui/react";
import { SSE } from "sse.js";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

function App() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const resultRef = useRef();

  const handleClearBtnClicked = () => {
    setPrompt("");
    setResult("");
  };

  const handleSubmitPromptBtnClicked = async () => {
    if (prompt !== "") {
      setIsLoading(true);
      setResult("");
      // const url = 'https://api.openai.com/v1/completions'
      // const url = "https://api.openai.com/v1/completions";
      const url = "http://localhost:8000/streaming/ask";
      // const url = 'https://api.openai.com/v1/chat/completions'
      const data = {
        // model: "gpt-3.5-turbo-instruct",
        query: prompt,
        // model: 'gpt-3.5-turbo',
        // messages: [
        //   {
        //     role: 'system',
        //     content: 'You are a helpful assistant.',
        //   },
        //   {
        //     role: 'user',
        //     content: `${prompt}`,
        //   },
        // ],
        // temperature: 0.5,
        // top_p: 0.95,
        // max_tokens: 100,
        // stream: true,
        // n: 1,
      };

      const source = new SSE(url, {
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${API_KEY}`,
        },
        method: "POST",
        payload: JSON.stringify({
          query: prompt,
        }),
      });

      source.addEventListener("message", (e) => {
        if (e.data != "[DONE]") {
          // console.log(e.data);
          // const payload = JSON.parse(e.data);
          const text = e.data;
          // const text = payload.choices[0].text;
          if (text != "\n") {
            // console.log(`Text: ${text}`);
            resultRef.current = text;
            // console.log(`resultRef.current: ${resultRef.current}`);
            setResult(resultRef.current);
          }
        } else {
          source.close();
        }
      });

      source.addEventListener("readystatechange", (e) => {
        if (e.readyState >= 2) {
          setIsLoading(false);
        }
      });

      source.stream();
    } else {
      console.log("put your prompt");
    }
  };

  const handlePromptChange = (e) => {
    const inputValue = e.target.value;
    setPrompt(inputValue);
  };

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  return (
    <Flex
      width="100vw"
      height="100vh"
      alignContent="center"
      justifyContent="center"
      bgGradient="linear(to-b, orange.100, purple.300)"
    >
      <Box width="100%" p="20px">
        <Heading
          as="h1"
          textAlign="center"
          fontSize="5xl"
          mt="100px"
          bgGradient="linear(to-b, #fff, #000)"
          bgClip="text"
        >
          SSE-TEST
        </Heading>
        {/* <Heading as='h2' textAlign='center' fontSize='3xl' mt='20px'>
          With Server Sent Events (SSE)
        </Heading>
        <Text fontSize='xl' textAlign='center' mt='30px'>
          This is a React sample web application making use of OpenAI's GPT-3
          API to perform prompt completions. Results are received using Server
          Sent Events (SSE) in real-time.
        </Text> */}
        <Flex direction="column" gap="1rem" justifyContent="center">
          <Textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="type your prompt here ..."
            mt="30px"
            size="lg"
          />
          <Button
            isLoading={isLoading}
            loadingText="Loading..."
            colorScheme="teal"
            size="lg"
            mt="30px"
            onClick={handleSubmitPromptBtnClicked}
          >
            send
          </Button>
        </Flex>
        {/* <Button
          colorScheme='teal'
          size='lg'
          mt='30px'
          ml='20px'
          onClick={handleClearBtnClicked}
        >
          clear
        </Button> */}
        {result != "" && (
          <Box maxW="2xl" m="0 auto">
            <Heading as="h5" textAlign="left" fontSize="lg" mt="40px">
              Result:
            </Heading>
            <Text fontSize="lg" textAlign="left" mt="20px">
              {result}
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}

export default App;
