// Mock for @/lib/animations — no-ops in Jest so DOM text values stay as rendered
module.exports = {
  animateCounter: jest.fn(),
  animateProgressBar: jest.fn(),
  orchestrateCaseLoad: jest.fn(),
  animateSpringEntrance: jest.fn(),
  animateCheckmark: jest.fn(),
}
