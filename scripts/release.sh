#!/usr/bin/env bash
set -euo pipefail

# Usage: npm run release [patch|minor|major]
# Builds, tests, publishes to npm, creates a GitHub release,
# and updates the Homebrew tap.

BUMP="${1:-patch}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: npm run release [patch|minor|major]"
  exit 1
fi

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Ensure on main
BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Error: must be on main branch (currently on $BRANCH)."
  exit 1
fi

# Pull latest
git pull --rebase

# Build and test
echo "=> Building..."
npm run build

echo "=> Testing..."
npm test

# Bump version (updates package.json + creates git tag)
echo "=> Bumping $BUMP version..."
NEW_VERSION="$(npm version "$BUMP" --message "release: v%s")"
echo "   New version: $NEW_VERSION"

# Push commit + tag
echo "=> Pushing to origin..."
git push && git push --tags

# Publish to npm
echo "=> Publishing to npm..."
npm publish

# Create GitHub release with tarball
echo "=> Creating GitHub release..."
TARBALL="paragraph-cli-${NEW_VERSION}.tar.gz"
git archive --format=tar.gz --prefix="paragraph-cli-${NEW_VERSION}/" HEAD -o "$TARBALL"
SHA256="$(shasum -a 256 "$TARBALL" | awk '{print $1}')"

gh release create "$NEW_VERSION" "$TARBALL" \
  --title "$NEW_VERSION" \
  --notes "## Install

\`\`\`bash
npm install -g @paragraph-com/cli@${NEW_VERSION#v}
\`\`\`

\`\`\`bash
brew tap paragraph-com/tap
brew install paragraph
\`\`\`

**sha256:** \`$SHA256\`"

TARBALL_URL="https://github.com/paragraph-xyz/paragraph-cli/releases/download/${NEW_VERSION}/${TARBALL}"

# Update Homebrew formula
echo "=> Updating Homebrew formula..."
FORMULA_DIR="$(mktemp -d)"
FORMULA_REPO="paragraph-com/homebrew-tap"

gh repo clone "$FORMULA_REPO" "$FORMULA_DIR" 2>/dev/null || {
  echo "   Creating Homebrew tap repo..."
  gh repo create "$FORMULA_REPO" --public --description "Homebrew tap for Paragraph CLI"
  gh repo clone "$FORMULA_REPO" "$FORMULA_DIR"
}

mkdir -p "$FORMULA_DIR/Formula"
cat > "$FORMULA_DIR/Formula/paragraph.rb" <<RUBY
class Paragraph < Formula
  desc "CLI for Paragraph — manage posts, subscribers, and publications"
  homepage "https://github.com/paragraph-xyz/paragraph-cli"
  url "$TARBALL_URL"
  sha256 "$SHA256"
  license "MIT"

  depends_on "node@22"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["\#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("\#{bin}/paragraph --version").strip
  end
end
RUBY

(
  cd "$FORMULA_DIR"
  git add -A
  git commit -m "paragraph ${NEW_VERSION}"
  git push
)

rm -rf "$FORMULA_DIR"

# Clean up tarball
rm -f "$TARBALL"

echo ""
echo "=> Released $NEW_VERSION"
echo "   npm: https://www.npmjs.com/package/@paragraph-com/cli"
echo "   gh:  https://github.com/paragraph-xyz/paragraph-cli/releases/tag/${NEW_VERSION}"
echo "   brew: brew tap paragraph-com/tap && brew install paragraph"
