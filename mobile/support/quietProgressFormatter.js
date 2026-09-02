const ProgressFormatter = require('@cucumber/cucumber/lib/formatter/progress_formatter').default;

class QuietProgressFormatter extends ProgressFormatter {
  logIssues() {
    // Suppress detailed failure stacks/messages in terminal.
  }
}

module.exports = QuietProgressFormatter;