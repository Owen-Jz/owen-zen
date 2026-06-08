import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import DictionaryPage from '@/app/dictionary/page';

// Mock next/link to avoid router dependency
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
// Category button names match exactly as written
function getCategoryButton(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name}\\s*\\(`) });
}

function getSearchInput() {
  return screen.getByPlaceholderText('Search terms, definitions...');
}

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------
describe('AI Prompting Dictionary', () => {
  // -------------------------------------------------------------------------
  // 1. Dictionary data loads
  // -------------------------------------------------------------------------
  describe('dictionary data loads', () => {
    it('renders the page title', () => {
      render(<DictionaryPage />);
      expect(screen.getByText('AI Prompting Dictionary')).toBeTruthy();
    });

    it('renders all category tabs with correct counts', () => {
      render(<DictionaryPage />);

      expect(screen.getByRole('button', { name: /^All\s*\(/ })).toBeTruthy();
      expect(getCategoryButton('UI/UX Design')).toBeTruthy();
      expect(getCategoryButton('Prompt Engineering')).toBeTruthy();
      expect(getCategoryButton('AI & ML Fundamentals')).toBeTruthy();
      expect(getCategoryButton('LLM Concepts')).toBeTruthy();
      expect(getCategoryButton('Product Strategy')).toBeTruthy();
      expect(getCategoryButton('Data & Logic')).toBeTruthy();
      expect(getCategoryButton('API & Integration')).toBeTruthy();
      expect(getCategoryButton('Software Development')).toBeTruthy();
      expect(getCategoryButton('AI Safety & Ethics')).toBeTruthy();
      expect(getCategoryButton('Business Strategy')).toBeTruthy();
    });

    it('renders the term count in the subheading', () => {
      render(<DictionaryPage />);
      expect(screen.getByText(/\d+ terms across \d+ categories/)).toBeTruthy();
    });

    it('renders term cards when All is selected', () => {
      render(<DictionaryPage />);
      // "Edge Case" is the first term in ALL_TERMS
      expect(screen.getByText('Edge Case')).toBeTruthy();
      // "Chain-of-Thought (CoT)" is a Prompt Engineering term
      expect(screen.getByText('Chain-of-Thought (CoT)')).toBeTruthy();
    });

    it('renders term definitions', () => {
      render(<DictionaryPage />);
      expect(
        screen.getByText(/A rare or extreme situation outside normal operating parameters\./)
      ).toBeTruthy();
    });

    it('renders example text when present', () => {
      render(<DictionaryPage />);
      // "Edge Case" has an example
      expect(screen.getByText(/What happens if a user's name is 500 characters long\?/)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Search filters results correctly
  // -------------------------------------------------------------------------
  describe('search filters results correctly', () => {
    it('filters terms by matching the term name', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'Edge Case' } });

      expect(screen.getByText('Edge Case')).toBeTruthy();
      // "Chain-of-Thought (CoT)" should not appear when searching for "Edge Case"
      expect(screen.queryByText('Chain-of-Thought (CoT)')).toBeNull();
    });

    it('filters terms by matching the definition', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'neural network' } });

      expect(screen.getByText('Neural Network')).toBeTruthy();
    });

    it('filters terms by matching the example', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: '500 characters' } });

      expect(screen.getByText('Edge Case')).toBeTruthy();
    });

    it('search is case-insensitive', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'CHAIN' } });

      expect(screen.getByText('Chain-of-Thought (CoT)')).toBeTruthy();
    });

    it('shows clear button when search has value', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'test' } });

      // The X button has no accessible name — Testing Library finds it as an empty button
      const clearButtons = screen.getAllByRole('button');
      // There should be more buttons after typing (the X appears)
      expect(clearButtons.length).toBeGreaterThan(11);
    });

    it('clearing search restores all terms', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'Edge Case' } });
      expect(screen.queryByText('Chain-of-Thought (CoT)')).toBeNull();

      // Click the X clear button — it has no accessible name, but it is the
      // ONLY empty-name button in the search bar area (not a tab)
      const buttons = screen.getAllByRole('button');
      const searchBarButtons = buttons.filter((b) => {
        // The search bar is a "relative" div; the clear btn is the only empty-btn
        // inside it. We match by its sibling lucide-x SVG inside the button.
        return (
          b.querySelector('svg[class*="lucide-x"]') !== null
        );
      });
      fireEvent.click(searchBarButtons[0]);

      expect(screen.getByText('Chain-of-Thought (CoT)')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Category tabs filter correctly
  // -------------------------------------------------------------------------
  describe('category tabs filter correctly', () => {
    it('shows only Prompt Engineering terms when that tab is active', () => {
      render(<DictionaryPage />);

      fireEvent.click(getCategoryButton('Prompt Engineering'));

      expect(screen.getByText('Chain-of-Thought (CoT)')).toBeTruthy();
      // UI/UX Design term should not appear
      expect(screen.queryByText('Edge Case')).toBeNull();
    });

    it('shows only UI/UX Design terms when that tab is active', () => {
      render(<DictionaryPage />);

      fireEvent.click(getCategoryButton('UI/UX Design'));

      expect(screen.getByText('Edge Case')).toBeTruthy();
      expect(screen.getByText('Friction')).toBeTruthy();
      // Prompt Engineering term should not appear
      expect(screen.queryByText('Chain-of-Thought (CoT)')).toBeNull();
    });

    it('shows only LLM Concepts terms when that tab is active', () => {
      render(<DictionaryPage />);

      fireEvent.click(getCategoryButton('LLM Concepts'));

      expect(screen.getByText('API (for LLMs)')).toBeTruthy();
      expect(screen.getByText('Max Tokens')).toBeTruthy();
    });

    it('shows only Business Strategy terms when that tab is active', () => {
      render(<DictionaryPage />);

      fireEvent.click(getCategoryButton('Business Strategy'));

      expect(screen.getByText('TAM / SAM / SOM')).toBeTruthy();
      expect(screen.getByText('Churn Rate')).toBeTruthy();
    });

    it('All tab restores all grouped categories', () => {
      render(<DictionaryPage />);

      // Click a specific category first
      fireEvent.click(getCategoryButton('Prompt Engineering'));
      expect(screen.queryByText('Edge Case')).toBeNull();

      // Switch back to All
      fireEvent.click(screen.getByRole('button', { name: /^All\s*\(/ }));
      expect(screen.getByText('Edge Case')).toBeTruthy();
      expect(screen.getByText('Chain-of-Thought (CoT)')).toBeTruthy();
    });

    it('category tab and search work together', () => {
      render(<DictionaryPage />);

      fireEvent.click(getCategoryButton('Prompt Engineering'));
      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'chain' } });

      expect(screen.getByText('Chain-of-Thought (CoT)')).toBeTruthy();
      // "Edge Case" is UI/UX Design, not Prompt Engineering
      expect(screen.queryByText('Edge Case')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Empty state renders for no results
  // -------------------------------------------------------------------------
  describe('empty state renders for no results', () => {
    it('shows empty state when search has no matches', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'xyzzyxnonexistent' } });

      // The empty state uses curly quotes — use a function matcher to ignore quote style
      expect(screen.getByText((content) => content.includes('No terms match'))).toBeTruthy();
      expect(screen.getByText('Try a different search term')).toBeTruthy();
    });

    it('shows empty state when category has no matching search', () => {
      render(<DictionaryPage />);

      fireEvent.click(getCategoryButton('Business Strategy'));
      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'neural network' } });

      expect(screen.getByText((content) => content.includes('No terms match'))).toBeTruthy();
    });

    it('hides term cards when no results', () => {
      render(<DictionaryPage />);

      const input = getSearchInput();
      fireEvent.change(input, { target: { value: 'thisdoesnotexist123' } });

      expect(screen.queryByText('Edge Case')).toBeNull();
      expect(screen.queryByText('Chain-of-Thought (CoT)')).toBeNull();
    });
  });
});
