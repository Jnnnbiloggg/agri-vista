// import { ref } from 'vue'
// import { supabase } from '@/lib/supabase'

// export interface Announcement {
//   id: number
//   title: string
//   description: string
//   duration: string
//   created_at: string
// }

// export const useAnnouncements = () => {
//   const announcements = ref<Announcement[]>([])
//   const loading = ref(false)
//   const error = ref<string | null>(null)

//   const fetchAnnouncements = async () => {
//     loading.value = true
//     error.value = null

//     const { data, error: fetchError } = await supabase
//       .from('announcements')
//       .select('*')
//       .order('created_at', { ascending: false })

//     if (fetchError) {
//       error.value = fetchError.message
//       console.error('Error fetching announcements:', fetchError)
//     } else {
//       announcements.value = data || []
//     }

//     loading.value = false
//   }

//   const createAnnouncement = async (
//     announcement: Omit<Announcement, 'id' | 'created_at'>,
//     imageFile: File | null,
//   ) => {
//     let image_url = null

//     if (imageFile) {
//       image_url = await uploadImage(imageFile)
//     }

//     const { data, error } = await supabase
//       .from('announcements')
//       .insert([{ ...announcement, image_url }])
//       .select()
//       .single()

//     loading.value = true
//     error.value = null

//     const { data, error: createError } = await supabase
//       .from('announcements')
//       .insert([announcement])
//       .select()
//       .single()

//     if (createError) {
//       error.value = createError.message
//       console.error('Error creating announcement:', createError)
//       return null
//     } else {
//       announcements.value.unshift(data)
//       return data
//     }
//   }

//   const updateAnnouncement = async (
//     id: number,
//     updates: Partial<Omit<Announcement, 'id' | 'created_at'>>,
//   ) => {
//     loading.value = true
//     error.value = null

//     const { data, error: updateError } = await supabase
//       .from('announcements')
//       .update(updates)
//       .eq('id', id)
//       .select()
//       .single()

//     if (updateError) {
//       error.value = updateError.message
//       console.error('Error updating announcement:', updateError)
//       return null
//     } else {
//       const index = announcements.value.findIndex((a) => a.id === id)
//       if (index !== -1) {
//         announcements.value[index] = data
//       }
//       return data
//     }
//   }

//   const deleteAnnouncement = async (id: number) => {
//     loading.value = true
//     error.value = null

//     const { error: deleteError } = await supabase.from('announcements').delete().eq('id', id)

//     if (deleteError) {
//       error.value = deleteError.message
//       console.error('Error deleting announcement:', deleteError)
//       return false
//     } else {
//       announcements.value = announcements.value.filter((a) => a.id !== id)
//       return true
//     }
//   }

//   // Upload image to Supabase Storage
//   const uploadImage = async (file: File): Promise<string | null> => {
//     const fileExt = file.name.split('.').pop()
//     const fileName = `${Math.random()}.${fileExt}`
//     const filePath = `${fileName}`

//     const { error: uploadError } = await supabase.storage
//       .from('announcements')
//       .upload(filePath, file)

//     if (uploadError) {
//       console.error('Error uploading image:', uploadError)
//       return null
//     }

//     // Get public URL
//     const { data } = supabase.storage.from('announcements').getPublicUrl(filePath)

//     return data.publicUrl
//   }

//   return {
//     announcements,
//     loading,
//     error,
//     fetchAnnouncements,
//     createAnnouncement,
//     updateAnnouncement,
//     deleteAnnouncement,
//   }
// }
