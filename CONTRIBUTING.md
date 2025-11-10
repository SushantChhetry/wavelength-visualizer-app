# Contributing to Wavelength Visualizer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain a professional environment

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Modern browser with WebGL support

### Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/wavelength-visualizer-app.git
cd wavelength-visualizer-app
```

3. Install dependencies:
```bash
npm install
```

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:3000

### Project Structure

```
wavelength-visualizer-app/
├── src/
│   ├── audio/           # Audio processing (WebAudio, CQT, wavelets)
│   ├── math/            # Mathematical utilities (curl noise, SDE)
│   ├── render/          # Three.js rendering and particle system
│   ├── ui/              # User interface controllers
│   ├── shaders/         # GLSL shader code
│   ├── main.ts          # Application entry point
│   └── style.css        # Global styles
├── tests/               # Test files
├── public/              # Static assets
├── index.html           # HTML entry point
└── package.json         # Dependencies and scripts
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(audio): add wavelet transform implementation
fix(render): correct particle boundary conditions
docs(readme): update installation instructions
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Prefer functional patterns where appropriate

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Contributing Guidelines

### Reporting Issues

When reporting issues, include:

1. **Description**: Clear description of the problem
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Node version
6. **Screenshots**: If applicable

### Suggesting Features

Feature requests should include:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered?
4. **Additional Context**: Relevant examples, mockups, etc.

### Pull Requests

1. **Create an Issue First**: Discuss significant changes before implementing
2. **One Feature Per PR**: Keep PRs focused and manageable
3. **Update Tests**: Add/update tests for your changes
4. **Update Documentation**: Keep docs in sync with code
5. **Follow Style Guide**: Maintain consistency with existing code
6. **Test Thoroughly**: Ensure all tests pass
7. **Describe Changes**: Provide clear PR description

#### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Builds successfully
- [ ] Works in major browsers

### Code Review Process

1. Maintainers will review PRs
2. Address feedback promptly
3. Keep discussions focused on the code
4. Once approved, PR will be merged

## Areas for Contribution

### Audio Processing
- Additional wavelet families
- More sophisticated CQT implementation
- Real-time pitch detection
- Beat detection algorithms

### Mathematical Utilities
- Advanced noise functions
- Different SDE integration methods
- Physics-based simulations
- FFT optimizations

### Rendering
- WebGPU backend implementation
- Compute shader optimizations
- Additional particle effects
- Camera control improvements

### UI/UX
- Additional control options
- Visual presets
- Color scheme customization
- Mobile optimizations

### Documentation
- Tutorial videos
- API documentation
- Architecture diagrams
- Performance optimization guides

### Testing
- Unit test coverage
- Integration tests
- Performance benchmarks
- Browser compatibility tests

## Performance Guidelines

- Profile before optimizing
- Target 60 FPS on modern hardware
- Keep bundle size reasonable
- Minimize memory allocations in render loop
- Use Web Workers for heavy computation

## Security

- Never commit sensitive data
- Validate user inputs
- Follow OWASP guidelines
- Report security issues privately

## Questions?

- Open an issue for questions
- Join discussions on GitHub
- Check existing issues/PRs first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes (for significant contributions)
- README acknowledgments (for major features)

Thank you for contributing to Wavelength Visualizer! 🎵✨
