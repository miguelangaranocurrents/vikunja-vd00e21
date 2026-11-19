import {describe, it, expect} from 'vitest'
import {Schema, type Node as ProseMirrorNode} from '@tiptap/pm/model'

import {sliceToPlainText} from './clipboardText'

const schema = new Schema({
	nodes: {
		doc: {content: 'block+'},
		paragraph: {group: 'block', content: 'text*'},
		text: {group: 'inline'},
		listItem: {content: 'paragraph block*'},
		bulletList: {group: 'block', content: 'listItem+'},
		orderedList: {group: 'block', content: 'listItem+', attrs: {start: {default: 1}}},
	},
})

function p(text: string): ProseMirrorNode {
	return schema.node('paragraph', null, text ? [schema.text(text)] : [])
}

function item(text: string, ...children: ProseMirrorNode[]): ProseMirrorNode {
	return schema.node('listItem', null, [p(text), ...children])
}

function doc(...children: ProseMirrorNode[]): ProseMirrorNode {
	return schema.node('doc', null, children)
}

describe('sliceToPlainText', () => {
	it('keeps bullet markers for list items', () => {
		const d = doc(
			p('start'),
			schema.node('bulletList', null, [item('this'), item('is'), item('a'), item('list')]),
			p('end'),
		)
		expect(sliceToPlainText(d.slice(0))).toBe('start\n- this\n- is\n- a\n- list\nend')
	})

	it('numbers ordered list items', () => {
		const d = doc(schema.node('orderedList', {start: 3}, [item('a'), item('b')]))
		expect(sliceToPlainText(d.slice(0))).toBe('3. a\n4. b')
	})

	it('indents nested list items', () => {
		const nested = schema.node('bulletList', null, [item('inner')])
		const d = doc(schema.node('bulletList', null, [item('outer', nested)]))
		expect(sliceToPlainText(d.slice(0))).toBe('- outer\n  - inner')
	})

	it('returns plain paragraphs one per line', () => {
		const d = doc(p('a'), p('b'))
		expect(sliceToPlainText(d.slice(0))).toBe('a\nb')
	})
})
