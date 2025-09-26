import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import assets from "../assets/assets"
import type { User } from "../types/user"
import { AuthContext } from "../../context/AuthContext"


const ProfilePage = () => {

  const {authUser, updateProfile} = useContext(AuthContext) as {authUser: User | null, updateProfile: (body: {name: string, bio: string, profilePic: string}) => Promise<void>}

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const navigate = useNavigate()
  const [name, setName] = useState(authUser?.name || '')
  const [bio, setBio] = useState(authUser?.bio || '')

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if(!selectedImage){
    await updateProfile({name: name, bio: bio, profilePic: authUser?.profilePic || ''})
    navigate('/')
    return
  }
  const reader = new FileReader()
  reader.readAsDataURL(selectedImage)
  reader.onload = async () => {
    const base64Image = reader.result as string
    await updateProfile({name: name, bio, profilePic: base64Image})
    navigate('/')
  }
}

  return (
    <div className=' min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'>Profile Details</h3>
          <label htmlFor='avatar' className='flex item-center gap-3 cursor-pointer'>
            <input onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
             type="file" id='avatar' accept='png, jpg, jpeg' hidden/>
            <img src={selectedImage ? URL.createObjectURL(selectedImage) : authUser?.profilePic || assets.avatar_icon} alt="" className={`w-12 h-12 ${selectedImage && 'rounded-full'}`}/>
            upload profile image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name}
           type="text" required placeholder="Your Name" className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" />
           <textarea onChange={(e) => setBio(e.target.value)} value={bio}
           rows={4} placeholder="Write Your Bio" className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"></textarea>
           <button type="submit" className="bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer">Save</button>
        </form>
        <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImage && 'rounded-full'}`} src={authUser?.profilePic || assets.logo_icon} alt="" />
      </div>
    </div>
  )
}

export default ProfilePage