# MarkItDown Setup Guide

## Overview

[MarkItDown](https://github.com/microsoft/markitdown) is a lightweight Python utility maintained by Microsoft that converts various file formats (PDF, Word, PowerPoint, Excel, images, audio, HTML, and more) to Markdown. It is commonly used to prepare documents for LLM and text-analysis pipelines.

This project is a TypeScript codebase and does not depend on MarkItDown. This guide documents how to install and use it as a standalone tool, for anyone who wants to convert reference documents (e.g. PRs, specs, design docs) to Markdown alongside this repository.

## Prerequisites

- Python 3.10 or higher
- `git` and `pip`
- A virtual environment is recommended to avoid dependency conflicts:

```bash
python -m venv .venv
source .venv/bin/activate
```

## Installation from source

```bash
git clone git@github.com:microsoft/markitdown.git
cd markitdown
pip install -e 'packages/markitdown[all]'
```

The `[all]` extra installs every optional dependency (PDF, DOCX, PPTX, XLSX, audio transcription, etc.). For a lighter install, target only the formats you need, e.g.:

```bash
pip install -e 'packages/markitdown[pdf,docx,pptx]'
```

Alternatively, without cloning the source, install the published package directly:

```bash
pip install 'markitdown[all]'
```

## Usage

### Command-line

```bash
markitdown path-to-file.pdf > document.md
# or
markitdown path-to-file.pdf -o document.md
# or, piped
cat path-to-file.pdf | markitdown
```

### Python API

```python
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("path-to-file.pdf")
print(result.text_content)
```

## Security note

MarkItDown performs I/O with the privileges of the current process (similar to `open()` or `requests.get()`). When converting untrusted input, sanitize file paths/URLs and prefer the narrowest conversion method available (e.g. `convert_stream()` rather than a broad local/remote convert call). See the [MarkItDown security considerations](https://github.com/microsoft/markitdown#security-considerations) for details.

## Related resources

- [MarkItDown repository](https://github.com/microsoft/markitdown)
- [MarkItDown on PyPI](https://pypi.org/project/markitdown/)
