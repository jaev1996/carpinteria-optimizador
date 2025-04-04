import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MaterialPiece, RequiredCut } from "../utils/types";
import { FiTrash2, FiPlus } from "react-icons/fi";

const formSchema = z.object({
  materialWidth: z.number().min(1),
  materialHeight: z.number().min(1),
  materialQuantity: z.number().min(1),
  allowRotation: z.boolean().default(true),
  cuts: z.array(
    z.object({
      width: z.number().min(1),
      height: z.number().min(1),
      quantity: z.number().min(1),
      canRotate: z.boolean().default(true),
    })
  ),
});

interface InputFormProps {
  onSubmit: (data: {
    material: MaterialPiece;
    requiredCuts: RequiredCut[];
    allowRotation: boolean;
  }) => void;
  initialMaterial?: MaterialPiece;
}

export default function InputForm({ onSubmit, initialMaterial }: InputFormProps) {
  const { register, handleSubmit, control, watch } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialWidth: initialMaterial?.width || 240,
      materialHeight: initialMaterial?.height || 160,
      materialQuantity: initialMaterial?.quantity || 1,
      allowRotation: true,
      cuts: [{ width: 50, height: 50, quantity: 5, canRotate: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "cuts",
  });

  const allowRotation = watch("allowRotation");

  const processSubmit = (data: any) => {
    const material: MaterialPiece = {
      width: data.materialWidth,
      height: data.materialHeight,
      quantity: data.materialQuantity,
    };

    const requiredCuts: RequiredCut[] = data.cuts.map((cut: any) => ({
      width: cut.width,
      height: cut.height,
      quantity: cut.quantity,
      canRotate: allowRotation && cut.canRotate,
    }));

    onSubmit({ 
      material, 
      requiredCuts, 
      allowRotation: data.allowRotation 
    });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Largo del Lienzo (cm)
          </label>
          <input
            type="number"
            step="0.1"
            {...register("materialWidth", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ancho del Lienzo (cm)
          </label>
          <input
            type="number"
            step="0.1"
            {...register("materialHeight", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cantidad de Lienzos
          </label>
          <input
            type="number"
            {...register("materialQuantity", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center mt-4">
        <input
          type="checkbox"
          id="allowRotation"
          {...register("allowRotation")}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="allowRotation" className="ml-2 block text-sm text-gray-900">
          Permitir rotación automática de piezas
        </label>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Piezas Requeridas</h3>
          <button
            type="button"
            onClick={() => append({ width: 50, height: 50, quantity: 1, canRotate: true })}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <FiPlus className="mr-1" /> Agregar Pieza
          </button>
        </div>
        
        <div className="space-y-3 mt-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-5 gap-4 items-end bg-gray-50 p-3 rounded">
              <div>
                <label className="block text-xs text-gray-700">Largo (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register(`cuts.${index}.width`, { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700">Ancho (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register(`cuts.${index}.height`, { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  {...register(`cuts.${index}.quantity`, { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`cuts.${index}.canRotate`}
                  {...register(`cuts.${index}.canRotate`)}
                  disabled={!allowRotation}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label 
                  htmlFor={`cuts.${index}.canRotate`} 
                  className={`ml-2 block text-xs ${allowRotation ? 'text-gray-700' : 'text-gray-400'}`}
                >
                  Permitir rotación
                </label>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Eliminar pieza"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Calcular Cortes Óptimos
      </button>
    </form>
  );
}