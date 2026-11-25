
'use client';

import React from 'react';

import { useForm } from 'react-hook-form';




interface CreateProjectModalProps {
  onClose: () => void;
  onProjectCreated: () => void;
}
interface ProjectFormData {
  name: string;
  client_name: string;
}

const CreateProjectModal = ({
  onClose,
  onProjectCreated
}: CreateProjectModalProps) => {


const {
  register,
  handleSubmit,
  formState: { errors }
} = useForm<ProjectFormData>();

 const handleprojectsubmission = async (formData: ProjectFormData) => {
     try{
         const response=await fetch(
          "http://localhost:8000/api/v1/projects",
          {
            method:'POST',
            headers:{
              "Content-Type": "application/json"
            },
            body:JSON.stringify({
              name:formData.name,
              client_name:formData.client_name,
              workspace_id:"83192aeb-67e9-40ce-9fb8-d822c6518d9b"
            })
          }
         );
         if(!response.ok){
          throw new Error("Failed to create project");
         }
         const data= await response.json();

         console.log("project created",data);

         onProjectCreated();
         onClose();
     }
     catch(error){
         console.log("Error creating project:",error);
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-xl">

        <h2 className="mb-5 text-xl font-semibold text-white">
          Create New Project
        </h2>

        <form onSubmit={handleSubmit(handleprojectsubmission)}>

          <div className="mb-4">
            <label htmlFor="projectname" className="mb-2 block text-sm text-white">
              Project Name
            </label>

            <input
              type="text"
              id="projectname"
              {...register("name", {
              required: "Project name is required",
              validate: (value) =>
              value.trim().length >= 3 ||
              "Project name must be at least 3 characters"
              })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
            />
            {errors.name && (
            <p className="mt-2 text-sm text-red-400">
            {errors.name.message?.toString()}
             </p>
            )}
          </div>

          <div className="mb-5">
            <label htmlFor="clientname" className="mb-2 block text-sm text-white">
              Client Name
            </label>

            <input
              type="text"
              id="clientname"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
              {...register('client_name',{required:"client name is required"})}
            />
            {errors.client_name && (
            <p className="mt-2 text-sm text-red-400">
            {errors.client_name.message?.toString()}
            </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-700 px-4 py-2 text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-4 py-2 text-white"
            >
              Save Project
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
