/* eslint-disable react/prop-types */
interface Template {
  id: string;
  title: string;
  content: string;
}

interface TemplateListProps {
  templates: Template[];
  onTemplateSelect: (content: string) => void;
  isDarkMode?: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, onTemplateSelect, isDarkMode = false }) => {
  return (
    <div className="p-4">
      <h3 className={`mb-3 text-sm font-medium ${isDarkMode ? 'text-[hsl(0,0%,98%)]' : 'text-[hsl(0,0%,9%)]'}`}>
        Templates
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.content)}
            className={`rounded-lg p-3 text-left transition-colors ${
              isDarkMode
                ? 'bg-[hsl(0,0%,14.9%)] text-[hsl(0,0%,98%)] hover:bg-[hsl(0,0%,20%)]'
                : 'bg-[hsl(0,0%,96.1%)] text-[hsl(0,0%,9%)] hover:bg-[hsl(0,0%,90%)]'
            } border ${isDarkMode ? 'border-[hsl(0,0%,14.9%)]' : 'border-[hsl(0,0%,89.8%)]'}`}>
            <div className="text-sm font-medium">{template.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplateList;
