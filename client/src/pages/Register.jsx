import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordValidation, setPasswordValidation] = useState("");

  async function registerUser(ev) {
    ev.preventDefault();
    try {
      await axios.post("/register", {
        name,
        email,
        password,
      });
      if (name || email || password === "") {
        alert("please fill all the inputs");
      } else {
        alert("Registeration successful. Now you can log in");
      }
    } catch (e) {
      alert("Registeration failed. Please try again later");
    }

    setName("");
    setEmail("");
    setPassword("");
  }

  function handleChange(ev) {
    setPassword(ev.target.value);

    if (password.length < 8) {
      setPasswordValidation("password is not strong");
    } else {
      setPasswordValidation("");
    }
  }
  return (
    <div className='mt-4 grow flex items-center justify-around'>
      <div className='mb-32'>
        <h1 className='text-4xl text-center'>Register</h1>
        <form className='max-w-md mx-auto border ' onSubmit={registerUser}>
          <input
            type='text'
            placeholder='John Doe'
            value={name}
            onChange={(ev) => setName(ev.target.value)}
          />
          <input
            type='email'
            placeholder={"your@gmail.com"}
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
          <input
            type='password'
            placeholder='password'
            value={password}
            onChange={handleChange}
          />
          <p className='text-red-700 p-2 font-semibold'>{passwordValidation}</p>
          <button className='primary'>Register</button>
          <div className='text-center py-2 text-gray-500 '>
            Already a member?
            <Link className='underline text-black' to={"/login"}>
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
