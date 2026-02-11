import { UseFormRegister, FieldErrors } from 'react-hook-form'

interface FileUploadCardProps {
  register: UseFormRegister<any>
  errors: FieldErrors
}

export function FileUploadCard({ register, errors }: FileUploadCardProps) {
  return (
    <div>
      <label htmlFor="file" className="block text-sm font-medium text-gray-700">
        Dataset File *
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file"
              className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Upload a file</span>
              <input
                id="file"
                type="file"
                className="sr-only"
                accept=".csv,.xlsx,.xls"
                {...register('file', { required: 'File is required' })}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">CSV or XLSX up to 50MB</p>
        </div>
      </div>
      {errors.file && (
        <p className="mt-1 text-sm text-red-600">
          {errors.file.message as string}
        </p>
      )}
    </div>
  )
}
