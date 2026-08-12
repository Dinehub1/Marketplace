import os
import re

placeholder_patterns = [
    r'lorem ipsum',
    r'placeholder',
    r'example\.com',
    r'example image',
    r'coming soon',
    r'under construction',
    r'todo',
    r'fixme',
    r'your content here',
    r'Lorem Ipsum',
    r'placeholder text',
    r'example text',
    r'sample text',
    r'dummy text',
]

generic_patterns = [
    r'Welcome to',
    r'Welcome to our',
    r'Learn more',
    r'Get started',
    r'Click here',
    r'Read more',
    r'Find out more',
    r'Lorem ipsum dolor sit amet',
]

def check_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    issues = []
    for pat in placeholder_patterns:
        matches = re.findall(pat, content, re.IGNORECASE)
        if matches:
            issues.extend(matches)
    generic_matches = []
    for pat in generic_patterns:
        matches = re.findall(pat, content, re.IGNORECASE)
        if matches:
            generic_matches.extend(matches)
    score = 10.0
    score -= len(issues) * 2
    score -= len(generic_matches) * 0.5
    if score < 0:
        score = 0
    if score > 10:
        score = 10
    return {
        'file': path,
        'issues': issues,
        'generic_matches': generic_matches,
        'score': round(score, 1)
    }

def main():
    base_dir = '.'
    all_files = []
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.tsx'):
                all_files.append(os.path.join(root, f))
    all_files.sort()
    results = []
    for f in all_files:
        res = check_file(f)
        results.append(res)
    print("Brand Router Files Analysis Report")
    print("=" * 60)
    for res in results:
        rel_path = os.path.relpath(res['file'], base_dir)
        print(f"File: {rel_path}")
        print(f"  Score: {res['score']}/10")
        if res['issues']:
            print(f"  Placeholder issues: {', '.join(set(res['issues']))}")
        if res['generic_matches']:
            print(f"  Generic phrases: {', '.join(set(res['generic_matches']))}")
        print()
    print("Summary:")
    print(f"Total files analyzed: {len(results)}")
    low_score = [r for r in results if r['score'] < 5]
    print(f"Low quality (score < 5): {len(low_score)}")
    for r in low_score:
        rel_path = os.path.relpath(r['file'], base_dir)
        print(f"  {rel_path}: {r['score']}")
    print("\nFiles needing attention (score < 7):")
    needs_attention = [r for r in results if r['score'] < 7]
    for r in needs_attention:
        rel_path = os.path.relpath(r['file'], base_dir)
        print(f"  {rel_path}: {r['score']}")

if __name__ == '__main__':
    main()
