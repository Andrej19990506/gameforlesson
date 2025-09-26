import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {
  const [currentState, setCurrentState] = useState('Sign Up')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)

  const {login} = useContext(AuthContext) as {login: (state: string, credentials: {name: string, email: string, password: string, bio: string}) => Promise<void>}

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(currentState === 'Sign Up' && !isDataSubmitted){
      setIsDataSubmitted(true)
      return
    }
    login(currentState === 'Sign Up' ? 'signup' : 'login', {name, email, password, bio})
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
      <img src={assets.logo_big} alt='logo' className='w-[min(30vw,250px)]' />
      <form onSubmit={onSubmitHandler}
      className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-ld'> 
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currentState}
          {isDataSubmitted && (
            <img onClick={() => setIsDataSubmitted(false)}
            src={assets.arrow_icon} alt='' className='w-5 cursor-pointer' />
          )}
        </h2>
        {currentState === 'Sign Up' && !isDataSubmitted && (
          <input onChange={(e) => setName(e.target.value)} value={name}
          type='text' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='Name' required/>
        )}

        {!isDataSubmitted &&(
          <>
            <input onChange={(e) => setEmail(e.target.value)} value={email}
            type='email' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='Email' required/>
            <input onChange={(e) => setPassword(e.target.value)} value={password}
            type='password' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='Password' required/>
          </>
        )}

        {currentState === 'Sign Up' && isDataSubmitted && (
          <textarea onChange={(e) => setBio(e.target.value)} value={bio}
          rows={4} className='p-2 border border-gray-500  rounded-md focus:outline-none focus:ring-indigo-500' placeholder='Bio' required></textarea>
        )}

        <button type='submit' className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
          {currentState === 'Sign Up' ? 'Create Account' : 'Login'}
        </button>

        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <input type="checkbox" />
          <p>I agree to the terms and conditions</p>
        </div>

        <div className='flex flex-col gap-2'>
          {currentState === "Sign Up" ? (
            <p className='text-sm text-gray-600'>Already have an account? <span className='font-medium text-violet-600 cursor-pointer' onClick={() => setCurrentState('Login')}>Login</span></p>
          ) : (
            <p className='text-sm text-gray-600'>Create an account? <span className='font-medium text-violet-600 cursor-pointer' onClick={() => setCurrentState('Sign Up')}>Sign Up</span></p>
          )}
          

        </div>
      </form>
    </div>
  )
}

export default LoginPage