import json
import pymorphy3

# Инициализируем анализатор
morph = pymorphy3.MorphAnalyzer()

# Словарь сопоставления тегов pymorphy3 с понятными названиями падежей
CASES = {
    "nominative": "nomn",   # Именительный (Кто? Что?)
    "genitive": "gent",     # Родительный (Кого? Чего?)
    "dative": "datv",       # Дательный (Кому? Чему?)
    "accusative": "accs",   # Винительный (Кого? Что?)
    "ablative": "ablt",     # Творительный (Кем? Чем?)
    "locative": "loct"      # Предложный (О ком? О чём?)
}

def declinate_phrase(phrase: str, target_case: str) -> str:
    """
    Склоняет фразу в один указанный падеж, изменяя только согласуемые слова.
    """
    words = phrase.strip().split()
    if not words:
        return ""
    
    result_words = []
    main_noun_found = False 
    
    for word in words:
        clean_word = word.strip(".,!?\"'()[]")
        parsed = morph.parse(clean_word)
        
        if not parsed:
            result_words.append(word)
            continue
            
        p = parsed[0]
        
        if 'PREP' in p.tag or 'CONJ' in p.tag:
            result_words.append(word)
            main_noun_found = True
            continue
            
        if any(tag in p.tag for tag in ['NOUN', 'ADJF', 'PRTF', 'NUMR']):
            if 'NOUN' in p.tag and main_noun_found:
                result_words.append(word)
                continue
                
            inflected = p.inflect({target_case})
            if inflected:
                inflected_word = inflected.word
                if word.istitle():
                    inflected_word = inflected_word.capitalize()
                elif word.isupper():
                    inflected_word = inflected_word.upper()
                result_words.append(inflected_word)
            else:
                result_words.append(word)
                
            if 'NOUN' in p.tag:
                main_noun_found = True
        else:
            result_words.append(word)
            
    return " ".join(result_words)

def process_file_to_all_cases_json(input_file: str, output_file: str):
    output_data = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                phrase = line.strip()
                if not phrase:
                    continue 
                
                # Генерируем формы для каждого падежа
                cases_result = []
                for case_name, case_tag in CASES.items():
                    cases_result.append(declinate_phrase(phrase, case_tag))
                
                # Добавляем в общий список
                output_data.append(cases_result)
                
        # Сохраняем в JSON с отступами и поддержкой кириллицы
        with open(output_file, 'w', encoding='utf-8') as json_f:
            json.dump(output_data, json_f, ensure_ascii=False, indent=4)
            
        print(f"Complete. Saved to : {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found")

# --- Точка входа ---
if __name__ == "__main__":
    # Скрипт ожидает файл phrases.txt в той же папке
    process_file_to_all_cases_json("phrases.txt", "phrases_all_cases.json")
