import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { FileUploadCard } from '../components/FileUploadCard'
import { Alert } from '../components/Alert'

type UploadFormData = {
  file: FileList
  name: string
  description?: string
}

export function UploadPage() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UploadFormData>()
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // TODO: Replace with actual upload endpoint from OpenAPI when available
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const formData = new FormData()
      formData.append('file', data.file[0])
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)

      // This endpoint doesn't exist yet - placeholder for when it's added to OpenAPI
      const response = await fetch('/api/v1/datasets/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      setUploadSuccess(true)
      reset()
      setTimeout(() => setUploadSuccess(false), 5000)
    },
  })

  const onSubmit = (data: UploadFormData) => {
    uploadMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Dataset</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload CSV or XLSX files to create a new dataset
        </p>
      </div>

      {/* Alert for missing API endpoint */}
      <Alert variant="warning">
        ⚠️ <strong>Upload endpoint not yet implemented in backend.</strong>
        <br />
        The OpenAPI spec needs a <code>POST /api/v1/datasets/upload</code> endpoint.
        <br />
        This form will submit when the endpoint is available.
      </Alert>

      {uploadSuccess && (
        <Alert variant="success">
          ✓ Dataset uploaded successfully!
        </Alert>
      )}

      {uploadMutation.error && (
        <Alert variant="error">
          Upload failed: {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Unknown error'}
        </Alert>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Dataset Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Dataset Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Dataset name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="My Dataset"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Brief description of the dataset..."
              />
            </div>

            {/* File Upload */}
            <FileUploadCard register={register} errors={errors} />

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Dataset'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Supported File Formats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900">Supported Formats</h3>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
          <li>CSV (.csv) - Comma-separated values</li>
          <li>Excel (.xlsx, .xls) - Microsoft Excel spreadsheets</li>
        </ul>
      </div>
    </div>
  )
}
