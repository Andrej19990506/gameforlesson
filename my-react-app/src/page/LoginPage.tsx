import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, FileText } from 'lucide-react'

const LoginPage = () => {
  const [currentState, setCurrentState] = useState('Sign Up')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const {login} = useContext(AuthContext) as {login: (state: string, credentials: {name: string, username?: string, email: string, password: string, bio: string}) => Promise<void>}

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(currentState === 'Sign Up' && !isDataSubmitted){
      setIsDataSubmitted(true)
      return
    }
    if(currentState === 'Sign Up' && !agreeToTerms) {
      return
    }
    login(currentState === 'Sign Up' ? 'signup' : 'login', {name, username, email, password, bio})
  }

  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
      <div className='w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center'>
        {/* Left Side - Logo and Welcome */}
        <div className='text-center lg:text-left space-y-6'>
          <div className='space-y-4'>
            <img src={assets.logo_big} alt='logo' className='w-32 h-32 mx-auto lg:mx-0' />
            <h1 className='text-4xl font-bold text-white'>
              Добро пожаловать в <span className='text-violet-400'>ChatApp</span>
            </h1>
            <p className='text-xl text-gray-300'>
              Общайтесь с друзьями в реальном времени
            </p>
          </div>
          <div className='hidden lg:block space-y-4'>
            <div className='flex items-center gap-3 text-gray-300'>
              <div className='w-2 h-2 bg-violet-400 rounded-full'></div>
              <span>Безопасные сообщения</span>
            </div>
            <div className='flex items-center gap-3 text-gray-300'>
              <div className='w-2 h-2 bg-violet-400 rounded-full'></div>
              <span>Реакции и эмодзи</span>
            </div>
            <div className='flex items-center gap-3 text-gray-300'>
              <div className='w-2 h-2 bg-violet-400 rounded-full'></div>
              <span>Статус онлайн</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className='w-full max-w-md mx-auto'>
          <div className='bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700'>
            {/* Header */}
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-bold text-white mb-2'>
                {currentState === 'Sign Up' ? 'Создать аккаунт' : 'Войти в аккаунт'}
              </h2>
              <p className='text-gray-400'>
                {currentState === 'Sign Up' ? 'Заполните форму для регистрации' : 'Введите свои данные для входа'}
              </p>
            </div>

            <form onSubmit={onSubmitHandler} className='space-y-6'>
              {/* Name Field - Only for Sign Up */}
              {currentState === 'Sign Up' && !isDataSubmitted && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-300'>Имя</label>
                  <div className='relative'>
                    <User size={20} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                    <input 
                      onChange={(e) => setName(e.target.value)} 
                      value={name}
                      type='text' 
                      className='w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors' 
                      placeholder='Введите ваше имя' 
                      required
                    />
                  </div>
                </div>
              )}

              {/* Username Field - Only for Sign Up */}
              {currentState === 'Sign Up' && !isDataSubmitted && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-300'>Имя пользователя (необязательно)</label>
                  <div className='relative'>
                    <User size={20} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                    <input 
                      onChange={(e) => setUsername(e.target.value)} 
                      value={username}
                      type='text' 
                      className='w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors' 
                      placeholder='@username' 
                    />
                  </div>
                  <p className='text-xs text-gray-500'>По этому имени другие пользователи смогут найти вас</p>
                </div>
              )}

              {/* Email and Password - Only when not in bio step */}
              {!isDataSubmitted && (
                <>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-300'>Email</label>
                    <div className='relative'>
                      <Mail size={20} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                      <input 
                        onChange={(e) => setEmail(e.target.value)} 
                        value={email}
                        type='email' 
                        className='w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors' 
                        placeholder='Введите ваш email' 
                        required
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-300'>Пароль</label>
                    <div className='relative'>
                      <Lock size={20} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                      <input 
                        onChange={(e) => setPassword(e.target.value)} 
                        value={password}
                        type={showPassword ? 'text' : 'password'} 
                        className='w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors' 
                        placeholder='Введите пароль' 
                        required
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300'
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Bio Field - Only for Sign Up when in bio step */}
              {currentState === 'Sign Up' && isDataSubmitted && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-300'>О себе</label>
                  <div className='relative'>
                    <FileText size={20} className='absolute left-3 top-3 text-gray-400' />
                    <textarea 
                      onChange={(e) => setBio(e.target.value)} 
                      value={bio}
                      rows={4} 
                      className='w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors resize-none' 
                      placeholder='Расскажите о себе...' 
                      required
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => setIsDataSubmitted(false)}
                    className='flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors'
                  >
                    <ArrowLeft size={16} />
                    Назад к основным данным
                  </button>
                </div>
              )}

              {/* Terms and Conditions - Only for Sign Up */}
              {currentState === 'Sign Up' && (
                <div className='flex items-start gap-3'>
                  <input 
                    type="checkbox" 
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className='mt-1 w-4 h-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500 focus:ring-2'
                  />
                  <p className='text-sm text-gray-400'>
                    Я согласен с <span className='text-violet-400 hover:text-violet-300 cursor-pointer'>условиями использования</span> и <span className='text-violet-400 hover:text-violet-300 cursor-pointer'>политикой конфиденциальности</span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type='submit' 
                disabled={currentState === 'Sign Up' && !agreeToTerms}
                className='w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {currentState === 'Sign Up' ? 'Создать аккаунт' : 'Войти'}
              </button>

              {/* Switch between Login and Sign Up */}
              <div className='text-center'>
                {currentState === "Sign Up" ? (
                  <p className='text-sm text-gray-400'>
                    Уже есть аккаунт?{' '}
                    <span 
                      className='font-medium text-violet-400 hover:text-violet-300 cursor-pointer transition-colors' 
                      onClick={() => setCurrentState('Login')}
                    >
                      Войти
                    </span>
                  </p>
                ) : (
                  <p className='text-sm text-gray-400'>
                    Нет аккаунта?{' '}
                    <span 
                      className='font-medium text-violet-400 hover:text-violet-300 cursor-pointer transition-colors' 
                      onClick={() => setCurrentState('Sign Up')}
                    >
                      Зарегистрироваться
                    </span>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage