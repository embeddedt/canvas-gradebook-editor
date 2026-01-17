export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type NativeSelectProps<T extends string | number> = {
  value: T | "";
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
};

export function NativeSelect<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = "Select an option",
  id,
  name,
  disabled,
}: NativeSelectProps<T>) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as T)}
    >
      <option value="" disabled>
        {placeholder}
      </option>

      {options.map((opt) => (
        <option key={String(opt.value)} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}