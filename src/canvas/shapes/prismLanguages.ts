/**
 * Register additional Prism languages for the code block shape.
 * Uses prism-react-renderer's bundled Prism instance and adds languages manually.
 */

import { Prism } from 'prism-react-renderer';

// Java
Prism.languages.java = Prism.languages.extend('clike', {
  'class-name': [
    /\b[A-Z][\w]*(?=\s+\w)/,
    /\b[A-Z]\w*(?=\s*<)/,
    /\b[A-Z]\w*/,
  ],
  keyword: /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while|yield)\b/,
  number: /\b0b[01][01_]*L?\b|\b0x[\da-f_]*\.?[\da-f_p+-]+\b|(?:\b\d[\d_]*\.?[\d_]*|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
  operator: {
    pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
    lookbehind: true,
  },
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
    lookbehind: true,
    greedy: true,
  },
  annotation: {
    pattern: /@\w+/,
    alias: 'punctuation',
  },
});

// C#
Prism.languages.csharp = Prism.languages.extend('clike', {
  keyword: /\b(?:abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|var|virtual|void|volatile|while)\b/,
  string: [
    { pattern: /@("|')(?:\1\1|\\[\s\S]|(?!\1)[\s\S])*\1/, greedy: true },
    { pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*?\1/, greedy: true },
  ],
});

// Ruby
Prism.languages.ruby = {
  comment: { pattern: /#.*/, greedy: true },
  string: [
    { pattern: /("|')(?:#\{[^}]+\}|\\.|(?!\1)[\s\S])*?\1/, greedy: true },
  ],
  keyword: /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|defined\?|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield)\b/,
  number: /\b(?:0[box])?(?:[\da-f]+(?:\.[\da-f]+)?|\d+(?:\.\d+)?)(?:e[+-]?\d+)?\b/i,
  operator: /\.{2,3}|&\.|===|<=>|[!=]=?~?|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>&|^~])=?|[?:]/,
  punctuation: /[(){}[\];.,]/,
};

// PHP
Prism.languages.php = Prism.languages.extend('clike', {
  keyword: /\b(?:and|array|as|break|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|list|match|namespace|new|null|or|print|private|protected|public|readonly|require|require_once|return|static|switch|throw|trait|try|use|var|while|xor|yield)\b/i,
  variable: /\$+(?:\w+\b|(?=\{))/i,
  string: [
    { pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/, greedy: true },
    { pattern: /("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/, greedy: true },
  ],
});

// Bash
Prism.languages.bash = {
  comment: { pattern: /(^|[^\\])#.*/, lookbehind: true },
  string: [
    { pattern: /("|')(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|(?!\1)[^\\`$])*\1/, greedy: true },
  ],
  variable: /\$(?:\w+|[!#?*@$]|\{[^}]+\})/,
  keyword: /\b(?:if|then|else|elif|fi|for|while|until|do|done|in|case|esac|function|select|return|exit|break|continue|export|source|alias|unalias|readonly|declare|local|typeset|unset|shift)\b/,
  builtin: /\b(?:echo|printf|read|cd|pwd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|find|sort|head|tail|wc|chmod|chown|curl|wget|ssh|tar|zip|unzip)\b/,
  operator: /\|\||&&|<<|>>|[!=<>]=?|[|&;]+/,
  punctuation: /[(){}[\];]/,
};
Prism.languages.shell = Prism.languages.bash;

// Docker
Prism.languages.docker = {
  keyword: { pattern: /^\s*(?:FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/mi, },
  comment: { pattern: /#.*/, greedy: true },
  string: { pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/, greedy: true },
};
Prism.languages.dockerfile = Prism.languages.docker;

// Scala
Prism.languages.scala = Prism.languages.extend('java', {
  keyword: /\b(?:abstract|case|catch|class|def|do|else|extends|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|super|this|throw|trait|try|type|val|var|while|with|yield)\b/,
});

// Dart
Prism.languages.dart = Prism.languages.extend('clike', {
  keyword: /\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|false|final|finally|for|get|hide|if|implements|import|in|interface|is|late|library|mixin|new|null|on|operator|part|required|rethrow|return|set|show|static|super|switch|sync|this|throw|true|try|typedef|var|void|while|with|yield)\b/,
  string: [
    { pattern: /r?("""|''')[\s\S]*?\1/, greedy: true },
    { pattern: /r?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/, greedy: true },
  ],
});

// Elixir
Prism.languages.elixir = {
  comment: { pattern: /#.*/, greedy: true },
  string: [
    { pattern: /"""[\s\S]*?"""/, greedy: true },
    { pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/, greedy: true },
  ],
  atom: { pattern: /:[a-zA-Z_]\w*/, alias: 'symbol' },
  keyword: /\b(?:after|alias|and|case|catch|cond|def|defcallback|defdelegate|defexception|defimpl|defmacro|defmodule|defoverridable|defp|defprotocol|defstruct|do|else|end|fn|for|if|import|in|not|or|raise|receive|require|rescue|try|unless|use|when|with)\b/,
  boolean: /\b(?:true|false|nil)\b/,
  number: /\b(?:0[box][\da-f_]+|\d[\d_]*)(?:\.[\d_]+)?(?:e[+-]?\d+)?\b/i,
  operator: /->|<-|\|>|&&?|\|\|?|\\\\|<[=>~]?|>[=>]?|::|\.\.\.?|[+\-*/%^&!@|=<>]=?|~>|<~>?/,
  punctuation: /[(){}[\];,.:]/,
};

export { Prism };
