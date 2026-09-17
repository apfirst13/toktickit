const fs = require('fs');
let f = fs.readFileSync('client/src/components/UserManagement.tsx', 'utf8');

f = f.replace(
  'import { useEffect, useState } from "react";',
  'import { useEffect, useState } from "react";\n\nfunction useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n}'
);

f = f.replace(
  'const [search, setSearch] = useState("");',
  'const [search, setSearch] = useState("");\n  const debouncedSearch = useDebounce(search, 300);'
);

f = f.replace(
  'if (search) params.append("search", search);',
  'if (debouncedSearch) params.append("search", debouncedSearch);'
);

f = f.replace(
  '}, [search, roleFilter, statusFilter, currentUser.role]);',
  '}, [debouncedSearch, roleFilter, statusFilter, currentUser.role]);'
);

fs.writeFileSync('client/src/components/UserManagement.tsx', f);
