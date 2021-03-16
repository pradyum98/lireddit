import React from "react";
import { Formik, Form } from "formik";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/form-control";
import { Box, Button, Input } from "@chakra-ui/react";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { useMutation } from "urql";

interface registerProps {}
const REGISTER_MUTATION = `
mutation Register($username: String!,$password: String! ) {
  register(options: { username: $username, password: $password }) {
		errors{
      field
      message
    }
    user{
      id
      createdAt
      username
    }
  }
}
`
const Register: React.FC<registerProps> = ({}) => {
  const [,register] = useMutation(REGISTER_MUTATION);
  return (
    <Wrapper>
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={async (values , {setErrors}) => {
         const response  = await register(values);
         if(response.data?.register.errors){
           setErrors({
              username: "Error",
              password: "Error",
            })
         }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              placeholder="username"
              label="Username"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              colorScheme="teal"
              isLoading={isSubmitting}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
