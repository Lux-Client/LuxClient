import React, { useState } from 'react';
import { Button } from '../ui/button';
import { PixelEditorModal } from '../PixelEditorModal';

const PixelEditorButton = ({ context }: { context?: any; api?: any }) => {
    const [showEditor, setShowEditor] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-[11px] font-medium"
                onClick={() => setShowEditor(true)}
            >
                Pixel Editor
            </Button>
            <PixelEditorModal
                isOpen={showEditor}
                onClose={() => setShowEditor(false)}
                onSave={(dataUrl: string) => {
                    context?.onIconSelect(dataUrl);
                    setShowEditor(false);
                }}
                initialIcon={context?.currentIcon}
            />
        </>
    );
};

export default PixelEditorButton;
