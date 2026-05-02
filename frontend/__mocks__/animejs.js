// Mock for animejs — used in Jest tests to prevent ESM import errors
const anime = jest.fn()
anime.timeline = jest.fn(() => ({ add: jest.fn().mockReturnThis() }))
anime.stagger = jest.fn(() => 0)
module.exports = anime
module.exports.default = anime
