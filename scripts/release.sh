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
if ! npm publish; then
  echo ""
  echo "ERROR: npm publish failed. The git tag $NEW_VERSION has been pushed."
  echo "To retry: npm publish"
  echo "To rollback: git tag -d $NEW_VERSION && git push origin :refs/tags/$NEW_VERSION && git reset --hard HEAD~1 && git push --force"
  exit 1
fi

# Use the npm tarball for the GitHub release (includes dist/, unlike git archive)
echo "=> Creating GitHub release..."
NPM_TARBALL="$(npm pack)"
SHA256="$(openssl dgst -sha256 "$NPM_TARBALL" | awk '{print $NF}')"
RELEASE_TARBALL="paragraph-cli-${NEW_VERSION}.tgz"
mv "$NPM_TARBALL" "$RELEASE_TARBALL"

if ! gh release create "$NEW_VERSION" "$RELEASE_TARBALL" \
  --title "$NEW_VERSION" \
  --notes "## Install

\`\`\`bash
npm install -g @paragraph-com/cli@${NEW_VERSION#v}
\`\`\`

\`\`\`bash
brew tap paragraph-xyz/tap
brew install paragraph
\`\`\`

**sha256:** \`$SHA256\`"; then
  echo ""
  echo "ERROR: GitHub release creation failed. npm package was published successfully."
  echo "To retry: gh release create $NEW_VERSION $RELEASE_TARBALL --title $NEW_VERSION"
  rm -f "$RELEASE_TARBALL"
  exit 1
fi

TARBALL_URL="https://github.com/paragraph-xyz/paragraph-cli/releases/download/${NEW_VERSION}/${RELEASE_TARBALL}"

# Update Homebrew formula
echo "=> Updating Homebrew formula..."
FORMULA_DIR="$(mktemp -d)"
FORMULA_REPO="paragraph-xyz/homebrew-tap"

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

  depends_on "node"

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
) || echo "WARNING: Homebrew formula update failed. Update manually."

rm -rf "$FORMULA_DIR"
rm -f "$RELEASE_TARBALL"

echo ""
echo "=> Released $NEW_VERSION"
echo "   npm: https://www.npmjs.com/package/@paragraph-com/cli"
echo "   gh:  https://github.com/paragraph-xyz/paragraph-cli/releases/tag/${NEW_VERSION}"
echo "   brew: brew tap paragraph-xyz/tap && brew install paragraph"
