import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain text for the clipboard. ProseMirror's default flattens blocks into bare lines,
// which drops the list markers a user expects when pasting into a plain text field.
export function sliceToPlainText(slice: Slice): string {
	const lines: string[] = []
	appendFragment(slice.content, '', lines)
	return lines.join('\n')
}

function appendFragment(fragment: Fragment, indent: string, lines: string[]) {
	fragment.forEach(node => appendNode(node, indent, lines))
}

function appendNode(node: ProseMirrorNode, indent: string, lines: string[]) {
	if (node.type.name === 'bulletList') {
		node.forEach(item => appendListItem(item, indent, '- ', lines))
		return
	}

	if (node.type.name === 'orderedList') {
		let number: number = node.attrs.start ?? 1
		node.forEach(item => appendListItem(item, indent, `${number++}. `, lines))
		return
	}

	if (node.isTextblock) {
		lines.push(indent + node.textContent)
		return
	}

	if (node.isText) {
		lines.push(indent + node.text)
		return
	}

	if (node.isBlock && !node.isLeaf) {
		appendFragment(node.content, indent, lines)
	}
}

function appendListItem(item: ProseMirrorNode, indent: string, marker: string, lines: string[]) {
	const continuation = indent + ' '.repeat(marker.length)

	item.forEach((child, _offset, index) => {
		if (index === 0 && child.isTextblock) {
			lines.push(indent + marker + child.textContent)
			return
		}
		if (index === 0) {
			lines.push(indent + marker.trimEnd())
		}
		appendNode(child, continuation, lines)
	})
}
